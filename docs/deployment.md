# Deployment runbook

How the site gets onto `chess.asanfa.com`: build step 4. Work through the sections in order. Every command runs on the server as root, from a root shell (SSH, the Hestia web terminal, the provider's console, or however you reach the server). Over SSH, work inside `tmux` (`tmux new -s deploy`, and `tmux attach -t deploy` after a dropped connection), so that a long step such as the image build keeps running if the connection drops. After each command, "You should see" says what you should see. If you see something else, stop there and ask before going on.

Two habits save trouble when pasting commands:

- Paste any command that uses `apt` or runs something in a container (`docker compose exec`, `deploy.sh`, `backup.sh`) on its own, or last in a paste. These read the keyboard while they run and swallow any lines pasted after them, even with `exec -T`.
- `HESTIA_USER` (section 0) lasts only for the shell it was set in. Set it again in every new shell: a new SSH connection, a new tmux window, and after a reboot.

Each section ends with how to undo it. To undo everything, undo the sections in reverse order.

## What ends up on the server

| Change | Where | Section |
| --- | --- | --- |
| Docker Engine and the Compose plugin, from Docker's apt repository | `/etc/apt/sources.list.d/docker.sources`, `/var/lib/docker` | 2 |
| The repository, with the server-only `.env` | `/opt/chess-trainer` | 3, 4 |
| Two containers: the app (Apache with PHP 8.4) on `127.0.0.1:8012`, and Postgres 18 with no port, its data in the volume `chess-trainer-production_postgres` | Docker | 5 |
| The Hestia proxy template `asanfa`, used by `chess.asanfa.com` | `/usr/local/hestia/data/templates/web/nginx/asanfa.tpl` and `.stpl` | 6 |
| A nightly database dump, keeping the last 14 | `/etc/cron.d/chess-trainer`, `/home/$HESTIA_USER/chess-trainer-backups` | 9 |

Nothing else changes: no nginx or Apache file is edited by hand, the Hestia firewall is left as it is, and PHP 8.3 and MySQL on the host are not touched.

The files in the repository:

- `Dockerfile.production` and `Dockerfile.production.dockerignore`: the production image. Node builds the assets in an earlier stage and is not in the final image.
- `compose.production.yaml`: the two services, the fixed Docker network and the volume.
- `deploy/env.production.example`: the template for the server's `.env`.
- `deploy/docker/`: the Apache site, PHP settings and the container's start script.
- `deploy/hestia/asanfa.tpl` and `asanfa.stpl`: the Hestia proxy templates.
- `deploy/deploy.sh`: deploys the latest `main`.
- `deploy/backup.sh` and `deploy/cron/chess-trainer`: the nightly dump.

## 0. Before you start

- Merge the step 4 pull request first. The server clones `main`, and these files are only on `main` once it is merged.
- Set the name of the Hestia user that owns `chess.asanfa.com`. The commands below, `deploy.sh` and `backup.sh` all read it from `HESTIA_USER`, and the scripts refuse to run without it. Set it again in every new root shell before going on:

```bash
export HESTIA_USER=the-hestia-user
```

```bash
v-list-web-domain "$HESTIA_USER" chess.asanfa.com > /dev/null && echo "HESTIA_USER is $HESTIA_USER"
```

You should see `HESTIA_USER is` and the name. An error means the name is wrong: set it again.

- The server needs about 3 GB free for Docker's images and build cache:

```bash
df -h /var/lib /opt /home
```

You should see at least 3 GB available on the disk that holds `/var/lib`.

## 1. Look before changing anything

These commands only read. Note down the answers marked "note"; the undo steps need them.

```bash
lsb_release -ds
```

You should see `Ubuntu 24.04` and a point release.

```bash
ss -ltnp | grep -E ':(8012|5432)\b'
```

You should see nothing: no program uses port 8012 or 5432 yet.

```bash
v-list-web-domain "$HESTIA_USER" chess.asanfa.com
```

You should see the domain with SSL, Let's Encrypt and the HTTPS redirect (SSL force) all switched on, and the `IP` it listens on. Note the `PROXY` value (probably `default`): it is the template to go back to.

```bash
v-list-web-domain-ssl "$HESTIA_USER" chess.asanfa.com | grep -E 'SUBJECT|VALID TIL|ISSUER'
```

You should see the subject `chess.asanfa.com`, a Let's Encrypt issuer, and the expiry date after `VALID TIL:` (Hestia's name for it in this listing). Note the date.

```bash
grep FIREWALL_SYSTEM /usr/local/hestia/conf/hestia.conf
```

You should see `FIREWALL_SYSTEM='iptables'`, which means the Hestia firewall is on. If it is empty, the firewall is off and section 8 is only a check.

```bash
ip -4 route
```

You should see no route in `172.17.0.0/16` or `172.30.12.0/24`. Docker uses the first for its default network and the app's network uses the second (set in `compose.production.yaml`). If either is taken, stop and ask.

Keep a copy of the firewall rules as they are before Docker, for the undo in section 2:

```bash
iptables-save > /root/iptables-before-docker.rules && wc -l /root/iptables-before-docker.rules
```

You should see a line count and the file name.

## 2. Install Docker

From Docker's official apt repository, as in [Docker's instructions for Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

```bash
apt-get update && apt-get install -y ca-certificates curl
```

You should see apt finish without errors. Both packages are probably already installed.

```bash
install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc
```

You should see no output.

```bash
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

You should see no output. `cat /etc/apt/sources.list.d/docker.sources` shows `Suites: noble`.

```bash
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

You should see apt fetch from `download.docker.com` and install the five packages. Docker starts at once and on every boot.

```bash
systemctl is-active docker && docker version --format '{{.Server.Version}}' && docker compose version
```

You should see `active`, a Docker version (28 or later), and `Docker Compose version v2.` or later (for example `v5.6.0`).

```bash
docker run --rm hello-world | grep 'Hello from Docker'
```

You should see `Hello from Docker!`.

```bash
iptables -S FORWARD | head -3 && iptables -S | grep -c DOCKER
```

You should see `-P FORWARD DROP` first (Docker sets the forwarding policy to drop, which does not affect the websites, since the server forwards nothing for them), then a count of Docker's rules, a dozen or more. Note the count.

Check that the other sites still answer, for example in a browser, and:

```bash
curl -sI https://chess.asanfa.com | head -1
```

You should see `HTTP/2 200`: still Hestia's placeholder.

**Undo:**

```bash
apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras
```

```bash
rm -rf /var/lib/docker /var/lib/containerd && rm /etc/apt/sources.list.d/docker.sources /etc/apt/keyrings/docker.asc
```

```bash
iptables-restore /root/iptables-before-docker.rules && v-update-firewall
```

The last command puts back the firewall rules from before Docker and has Hestia apply and save its own again. IP forwarding, which Docker switched on, goes off at the next reboot.

## 3. Get the code

The repository is public, so no credentials are needed.

```bash
git clone https://github.com/MM49165650/Chess-trainer.git /opt/chess-trainer && cd /opt/chess-trainer && git log -1 --oneline
```

You should see the clone finish and the latest commit on `main`, which includes the step 4 merge. `ls deploy` shows `backup.sh  cron  deploy.sh  docker  env.production.example  hestia`.

All later commands assume you are in `/opt/chess-trainer`. Run `cd /opt/chess-trainer` again whenever you open a new shell.

**Undo:** `rm -r /opt/chess-trainer`, after undoing sections 4 and 5.

## 4. The settings file

The settings and secrets live in `/opt/chess-trainer/.env`, readable by root only. Git ignores it, so it is never committed.

```bash
install -m 600 deploy/env.production.example .env
```

```bash
sed -i "s|^APP_KEY=.*|APP_KEY=base64:$(openssl rand -base64 32)|" .env && sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -hex 24)|" .env
```

You should see no output from either.

```bash
grep -cE '^APP_KEY=base64:.{44}$|^DB_PASSWORD=[0-9a-f]{48}$' .env && ls -l .env
```

You should see `2`, then `-rw------- 1 root root`.

Copy the contents of `.env` (`cat .env`) into your password manager. The database password is also stored inside the database volume, so if `.env` is lost it is needed to reach the data. `.env` also holds `COMPOSE_FILE=compose.production.yaml`, which makes a plain `docker compose` in this folder use the production file.

**Undo:** `rm /opt/chess-trainer/.env`

## 5. First start

`deploy.sh` does the first start just as it does every later deploy. The first build downloads the base images and packages and takes several minutes.

```bash
bash deploy/deploy.sh
```

You should see, in order: `==> Pulling main` and `Already up to date.`; `==> Building the image (the site stays up)` and Docker's build output, ending with the image `chess-trainer-app:latest` built; no backup step, since the database is not running yet; `==> Starting Postgres`; `==> Running the migrations` with each migration `DONE`; `==> Swapping the app container`, with the container `Healthy`; and finally `==> Deployed` and the commit.

Add the eleven masters. This is needed once; it is safe to run again.

```bash
docker compose exec app php artisan db:seed --force
```

You should see `Database\Seeders\MasterSeeder ... DONE`.

```bash
docker compose ps --format '{{.Service}}  {{.Status}}  {{.Ports}}'
```

You should see `app  Up … (healthy)  127.0.0.1:8012->80/tcp` and `postgres  Up … (healthy)  5432/tcp`. The Postgres line has no `->`: its port is not published.

```bash
ss -ltnp | grep -E ':(8012|5432)\b'
```

You should see one line only: `127.0.0.1:8012`, held by `docker-proxy`. Nothing listens on 5432 on the host.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8012/ && curl -s http://127.0.0.1:8012/ | grep -o '<title>[^<]*'
```

You should see `200`, then `<title>Asanfa Chess Trainer`.

```bash
docker compose exec app php artisan about --only=environment
```

You should see `Environment … production`, `Debug Mode … OFF` and `URL … chess.asanfa.com`.

**Undo:** `docker compose down` stops and removes the containers and keeps the database volume. Before anything has been imported, the database can be removed as well with `docker compose down --volumes`; never do that afterwards, because the game and puzzle IDs must stay the same. `docker image rm chess-trainer-app:latest` removes the image.

## 6. Point chess.asanfa.com at the app

The Hestia proxy template `asanfa` is a copy of a proxy template already working on this server for another site, with the port changed to 8012, plus the domain's access and error logs, so that Hestia's log viewer shows the visitors (section 7 uses them). The plain HTTP template keeps Hestia's HTTPS redirect include and the `nginx.conf_*` include; the HTTPS template keeps `nginx.ssl.conf_*`. Hestia's Let's Encrypt places its challenge answers in exactly those two include files, so issuing and renewing the certificate work as before.

```bash
install -m 644 deploy/hestia/asanfa.tpl deploy/hestia/asanfa.stpl /usr/local/hestia/data/templates/web/nginx/
```

Compare the HTTPS template with the one it was copied from. Set `EXISTING` to that template's name and `PORT` to the port it proxies to:

```bash
EXISTING=the-existing-template PORT=its-port && diff --strip-trailing-cr -w -B <(sed "s/$PORT/8012/" /usr/local/hestia/data/templates/web/nginx/$EXISTING.stpl) /usr/local/hestia/data/templates/web/nginx/asanfa.stpl
```

You should see only the comment lines at the top and the three log lines (`access_log` twice and `error_log`) as differences. `--strip-trailing-cr -w -B` ignores line endings, spacing and blank lines, since the existing template may have been saved on Windows; without them every line shows as different. Anything else means the existing template differs from the copy given for this step: stop and ask. The plain HTTP template was not copied from an existing one; what matters there is its two `include` lines:

```bash
grep -h include /usr/local/hestia/data/templates/web/nginx/asanfa.tpl /usr/local/hestia/data/templates/web/nginx/asanfa.stpl
```

You should see `nginx.forcessl.conf*` and `nginx.conf_*` from `asanfa.tpl`, and `nginx.ssl.conf_*` from `asanfa.stpl`, plus one comment line that mentions includes.

```bash
v-list-web-templates-proxy | grep -w asanfa
```

You should see `asanfa`.

```bash
v-change-web-domain-proxy-tpl "$HESTIA_USER" chess.asanfa.com asanfa
```

You should see no output. Hestia rewrites the domain's nginx files from the template and reloads nginx; the certificate files are not touched.

```bash
v-list-web-domain "$HESTIA_USER" chess.asanfa.com | grep -iE "proxy|ssl|letsencrypt"
```

You should see the proxy template `asanfa`, and SSL, the HTTPS redirect and Let's Encrypt still switched on, as in section 1.

```bash
grep -h proxy_pass /home/$HESTIA_USER/conf/web/chess.asanfa.com/nginx.conf /home/$HESTIA_USER/conf/web/chess.asanfa.com/nginx.ssl.conf && nginx -t
```

You should see `proxy_pass http://127.0.0.1:8012;` twice, then `syntax is ok` and `test is successful`.

Check the server directly, without Cloudflare, with the domain's IP from section 1 in place of `SERVER_IP`:

```bash
curl -sI --resolve chess.asanfa.com:443:SERVER_IP https://chess.asanfa.com/ | head -1
```

You should see `HTTP/2 200` (or `HTTP/1.1 200 OK`) with no certificate error, so the Let's Encrypt certificate is still served.

Then through Cloudflare:

```bash
curl -s https://chess.asanfa.com/ | grep -o '<title>[^<]*' && curl -sI http://chess.asanfa.com/ | grep -iE '^(HTTP|location)'
```

You should see `<title>Asanfa Chess Trainer`, then a `301` with `location: https://chess.asanfa.com/`. Open the site on a phone as well.

```bash
v-list-web-domain-ssl "$HESTIA_USER" chess.asanfa.com | grep 'VALID TIL' && grep -r v-update-letsencrypt /var/spool/cron/crontabs/
```

You should see the same expiry date as in section 1, and Hestia's renewal job, `v-update-letsencrypt-ssl`, which renews the certificate when it is close to expiry.

Optionally, prove that issuing still works with the new template by issuing the certificate again now (this counts once against Let's Encrypt's weekly limit of five for the same name):

```bash
v-add-letsencrypt-domain "$HESTIA_USER" chess.asanfa.com && v-list-web-domain-ssl "$HESTIA_USER" chess.asanfa.com | grep VALID
```

You should see no error, `VALID FROM` with today's date, and `VALID TIL` about 90 days from today. The expiry date noted in section 1 no longer applies. The challenge goes through Cloudflare: with Full (strict), Cloudflare reaches the server over HTTPS even for the challenge's HTTP address, which the HTTPS template answers through `nginx.ssl.conf_letsencrypt`.

**Undo:**

```bash
v-change-web-domain-proxy-tpl "$HESTIA_USER" chess.asanfa.com default
```

using the `PROXY` value noted in section 1 if it was not `default`. Then `rm /usr/local/hestia/data/templates/web/nginx/asanfa.tpl /usr/local/hestia/data/templates/web/nginx/asanfa.stpl`.

## 7. Visitors' IP addresses

A request passes three hops: Cloudflare, Hestia's nginx, then the app container. Laravel trusts only the second hop and only for two headers:

- Hestia's nginx connects to the app through Docker, so the app sees every request come from the gateway of its Docker network, `172.30.12.1`. That address is fixed in `compose.production.yaml`, and `TRUSTED_PROXIES=172.30.12.1` in `.env` makes it the only trusted proxy (read by `config/trustedproxy.php`).
- From that proxy Laravel believes `X-Forwarded-For` and `X-Forwarded-Proto` only (`bootstrap/app.php`). The host and port headers are ignored, since nginx passes on whatever a visitor sends in them.
- The template sends `X-Forwarded-For: $proxy_add_x_forwarded_for`, which is any value from further back followed by nginx's `$remote_addr`. Laravel takes the last address before the trusted proxy: `$remote_addr`.

So the visitor's real address reaches Laravel only if nginx's `$remote_addr` is already the visitor and not a Cloudflare server. That is what `cloudflare.inc` should do, with nginx's real IP module. Check it:

```bash
nginx -T 2>/dev/null | grep -nE 'cloudflare\.inc|real_ip_header|real_ip_recursive'
```

You should see an `include /etc/nginx/conf.d/cloudflare.inc;` line from `nginx.conf` in the `http` block, and `real_ip_header CF-Connecting-IP;`.

```bash
grep -c set_real_ip_from /etc/nginx/conf.d/cloudflare.inc && grep -v set_real_ip_from /etc/nginx/conf.d/cloudflare.inc
```

You should see about 22 (one `set_real_ip_from` line per range on [Cloudflare's list](https://www.cloudflare.com/ips/), IPv4 and IPv6), then only comments and the `real_ip_header` line. With this, nginx replaces `$remote_addr` with the `CF-Connecting-IP` header, but only for requests that really come from Cloudflare's ranges.

If the include is missing, or `real_ip_header` names anything other than `CF-Connecting-IP`, stop and ask: Laravel would then see Cloudflare's addresses.

Now check with a real request. Open `https://chess.asanfa.com/cdn-cgi/trace` on your phone and note the `ip=` line: your address as Cloudflare sees it. Then load any page of the site, and on the server:

```bash
tail -n 3 /var/log/apache2/domains/chess.asanfa.com.log
```

You should see your phone's address at the start of the latest lines, not a Cloudflare address. This log is written by the `asanfa` template's `access_log`, with nginx's `$remote_addr`.

```bash
docker compose logs app | grep -v ' /up ' | tail -n 3
```

You should see Apache's lines inside the container starting with `172.30.12.1`: every request comes from the trusted gateway. The `grep` leaves out the container's own health check, which calls `/up` from `127.0.0.1` every 10 seconds and would otherwise fill the last lines.

Last, what Laravel makes of such a request: a request from the gateway with a forged first address and a forged host.

```bash
docker compose exec app php artisan tinker --execute '$r = Illuminate\Http\Request::create("/", "GET", [], [], [], ["REMOTE_ADDR" => "172.30.12.1", "HTTP_X_FORWARDED_FOR" => "6.6.6.6, 203.0.113.7", "HTTP_X_FORWARDED_HOST" => "evil.example", "HTTP_X_FORWARDED_PROTO" => "https"]); app(Illuminate\Http\Middleware\TrustProxies::class)->handle($r, function ($r) { echo $r->ip(), " ", $r->getHost(), " ", $r->getScheme(), PHP_EOL; return response(""); });'
```

You should see `203.0.113.7 localhost https`: the address nginx added, not the forged one; the forged host ignored; HTTPS believed.

**Undo:** nothing on the server changed in this section. Emptying `TRUSTED_PROXIES` in `.env` and running `docker compose up -d app` makes Laravel trust no proxy.

## 8. The Hestia firewall and Docker

Both manage iptables. Read in Hestia 1.10.2's source ([`bin/v-update-firewall`](https://github.com/hestiacp/hestiacp/blob/1.10.2/bin/v-update-firewall)), what a firewall reload does:

- It flushes and rebuilds only the `INPUT` chain and its own `fail2ban-*` chains. It never touches `FORWARD`, the `nat` table or Docker's chains, so Docker's rules survive.
- Its rules accept everything on the loopback interface and every reply to a connection already open. Hestia's nginx reaching `127.0.0.1:8012`, and the container's replies, are both covered.
- It then runs `/usr/local/hestia/data/firewall/custom.sh` if that exists, and saves all tables to `/etc/iptables.rules` with `iptables-save`.

So **a reload in the panel does not remove Docker's rules**, and no `custom.sh` hook is needed. None is installed.

At boot, the `hestia-iptables` service loads `/etc/iptables.rules`, before the network is up. Docker starts later, after the network, and sets up its own chains afresh, so any Docker rules saved in that file are replaced. The one thing that would break the site is restarting `hestia-iptables` by hand on a running server: it reloads the saved file over Docker's live rules. Don't. If it happens, `systemctl restart docker` puts Docker's rules back, and the containers start again by themselves.

Check it on the server: the count first, then a reload exactly like the panel's, then the count and the site again.

```bash
iptables -S | grep -c DOCKER
```

You should see the same count as in section 2, or a few more now that the app's network exists. Note it.

```bash
v-update-firewall && iptables -S | grep -c DOCKER
```

You should see the same count as just before.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8012/ && curl -s -o /dev/null -w '%{http_code}\n' https://chess.asanfa.com/
```

You should see `200` twice. Also try a change in the panel (for example, add a firewall rule and then delete it) and load the site after each.

If the count drops or the site stops answering after a reload, run `systemctl restart docker` to recover, and stop and ask: that would mean the server behaves differently from Hestia's source, and the fix should be chosen then.

After the next reboot of the server, check `docker compose ps` (both containers healthy) and that the site answers.

**Undo:** nothing to undo.

## 9. Backups

Hestia's backups do not include Docker volumes, so `deploy/backup.sh` dumps the database every night with `pg_dump` into `chess-trainer-backups` in the Hestia user's home, `/home/$HESTIA_USER/chess-trainer-backups`, as `chess-trainer-YYYYMMDD-HHMMSS.dump` (UTC), and keeps the newest 14. `deploy.sh` also runs it before every deploy, so those dumps count towards the 14. The folder and the dumps belong to the Hestia user, readable by that user only, so they can be downloaded with Hestia's file manager. The script takes the user from `HESTIA_USER`, set in section 0, and stops if it is not set.

Take the first dump by hand:

```bash
bash deploy/backup.sh && ls -l /home/$HESTIA_USER/chess-trainer-backups
```

You should see `… backed up to /home/$HESTIA_USER/chess-trainer-backups/chess-trainer-….dump (…K)`, and the file, owned by the Hestia user, mode `-rw-------`.

Install the nightly job (03:30 server time):

```bash
sed "s/^HESTIA_USER=@HESTIA_USER@$/HESTIA_USER=$HESTIA_USER/" deploy/cron/chess-trainer > /etc/cron.d/chess-trainer && chmod 644 /etc/cron.d/chess-trainer && cat /etc/cron.d/chess-trainer
```

You should see the file with `HESTIA_USER=` followed by the Hestia user's name (the committed file has a placeholder there, which `sed` fills in), and the job line. The next morning:

```bash
tail -n 2 /var/log/chess-trainer-backup.log
```

You should see a `backed up to …` line with that night's date.

Hestia's own backup of the user should pick the folder up with the rest of the home directory, which would give the dumps a second copy wherever Hestia's backups go. Check after its next run: in the panel, open the user's latest backup and look for `chess-trainer-backups` among the user directories.

**Test a restore** into a separate scratch database, without touching the live one. With the newest dump:

```bash
DUMP=$(ls -1 /home/$HESTIA_USER/chess-trainer-backups/chess-trainer-*.dump | tail -n 1) && echo "$DUMP"
```

```bash
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" restore_test && pg_restore -U "$POSTGRES_USER" -d restore_test --no-owner' < "$DUMP"
```

```bash
docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d restore_test -tAc "select count(*) from masters" && psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from masters"'
```

You should see `11` twice: the restored copy matches the live database. Compare other tables the same way once content is imported (`master_games`, `puzzles`, `practice_games`).

```bash
docker compose exec -T postgres sh -c 'dropdb -U "$POSTGRES_USER" restore_test'
```

This removes only the scratch copy.

**Restore for real**, after losing data. This replaces the live database with the dump, so the IDs are the dump's: choose the newest good dump. The site is down until it finishes.

```bash
docker compose stop app
```

```bash
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction' < /home/$HESTIA_USER/chess-trainer-backups/chess-trainer-YYYYMMDD-HHMMSS.dump
```

```bash
docker compose start app && docker compose ps
```

You should see no errors from `pg_restore`, and both containers healthy. On a new server, follow sections 2 to 5 first, then restore the same way.

**Undo:** `rm /etc/cron.d/chess-trainer`. The dumps already taken stay in the folder.

## 10. Deploying updates

After a pull request is merged into `main`, in a root shell with `HESTIA_USER` set as in section 0:

```bash
bash /opt/chess-trainer/deploy/deploy.sh
```

Without `HESTIA_USER` it stops at once with `HESTIA_USER is not set` and changes nothing.

You should see the same steps as in section 5, now with `==> Backing up the database` and a `backed up to …` line before the migrations, and `==> Deployed` with the new commit at the end.

What it does:

1. Pulls `main`, fast-forward only. It refuses to run if the checkout is on another branch or has local commits.
2. Builds the new image while the old container keeps serving, and keeps the running image as `chess-trainer-app:previous`.
3. Dumps the database.
4. Runs the migrations from the new image. The old code is still serving at this point, so migrations should only add things.
5. Replaces the app container and waits until it is healthy. The site is down only for this swap, a few seconds. Requests in that moment get a 502 from nginx, which Cloudflare shows as its error page.
6. Removes images nothing uses any more, keeping `:previous`.

**Rolling back** to the image before the last deploy:

```bash
docker tag chess-trainer-app:previous chess-trainer-app:latest && docker compose up -d --no-deps --wait app
```

You should see the app container recreated and `Healthy`. This brings back the old code but not the old database: if the bad deploy ran a migration that the old code cannot work with, restore the dump taken just before it (section 9). Then fix the problem with a new pull request (a revert, for instance), so that `main` matches what is deployed again, and deploy that.

**Undo:** roll back as above.

## 11. Importing content

The full imports, steps 18, 23 and 29, were done by 16 October 2026. An import is run again to load new content, or to update stored answers after a change to the calculation (see "Updating answers after a rule change" below). Either way, the intermediate files go to the server like this. The source files never do, since the extracts run locally.

| File | Size | Step |
| --- | --- | --- |
| `data/intermediate/masters.jsonl` | about 14 MB | 18 |
| `data/intermediate/puzzles.jsonl` | about 3.3 MB | 23 |
| `data/intermediate/practice-games.jsonl` | about 41 MB, 4,000 games since 18 October 2026 | 29 |

1. Upload the file. With SSH, first run `mkdir -p /root/chess-imports` on the server, then, from PowerShell in the repository folder on your computer, with the server's IP address in place of `SERVER_IP`:

    ```powershell
    scp data\intermediate\puzzles.jsonl root@SERVER_IP:/root/chess-imports/
    ```

    Use the IP address, not `chess.asanfa.com`: Cloudflare does not pass SSH through. Without SSH, use Hestia's file manager, logged in as the Hestia user, and upload into a new folder `chess-imports` in the home directory; in step 2, read from `/home/$HESTIA_USER/chess-imports/` instead.
2. As root, copy it into the folder the app container sees, read-only, as `/var/www/html/data/intermediate` (the bind mount in `compose.production.yaml`), from wherever step 1 put it:

    ```bash
    install -d /opt/chess-trainer/data/intermediate && install -m 644 /root/chess-imports/puzzles.jsonl /opt/chess-trainer/data/intermediate/
    ```

3. Check that it arrived whole: `sha256sum /opt/chess-trainer/data/intermediate/puzzles.jsonl` on the server must match `Get-FileHash data\intermediate\puzzles.jsonl` in PowerShell on the computer it came from (PowerShell prints it in capitals).
4. Run the load with `--dry-run` first, then for real, each in its own paste, for example `docker compose exec -T app php artisan import:puzzles data/intermediate/puzzles.jsonl --dry-run`. The masters file loads with `import:master-games`, the practice games with `import:practice-games`. Run the practice games load as `php -d memory_limit=512M artisan import:practice-games …`: the import reads the whole file at once, and with 4,000 games it peaked at 117 MB, close to PHP's usual 128 MB limit. The app container has 768 MB, so 512 MB for this one command is safe.
5. Delete the uploaded copy from `chess-imports` afterwards, and take a backup (`bash deploy/backup.sh`).

Git ignores `data/`, so `git pull` never touches these files. Each load is safe to rerun and never deletes, so the IDs stay stable.

**Updating answers after a rule change**

When a change to the calculation in Appendix B of the requirements raises `ANSWERS_VERSION`, the practice games already on the server keep their old answers until they are updated. Done this way on 17 October 2026, for answers version 4.

1. Merge and deploy the pull request first (section 10).
2. On your computer, regenerate `data/intermediate/practice-games.jsonl` with the same source and options, and update the local database with `--update`. Check that it holds the same games with the same IDs, 4,000 since 18 October 2026, and that every game carries the new version. In PowerShell, in the repository folder, this prints the number of games in the file, 4000, when the file is at version 6 (change the number for a later version):

    ```powershell
    (Select-String -Path data\intermediate\practice-games.jsonl -Pattern '"answers_version":\s*6').Count
    ```

    Keep the fingerprint from `Get-FileHash data\intermediate\practice-games.jsonl` for step 3. Upload only this file, not the backup copies the regeneration leaves beside it.
3. Upload it and check its fingerprint as in steps 1 to 3 above.
4. Take a backup, in its own paste: `bash deploy/backup.sh`.
5. Run the load with `--dry-run --update`, in its own paste:

    ```bash
    docker compose exec -T app php -d memory_limit=512M artisan import:practice-games data/intermediate/practice-games.jsonl --dry-run --update
    ```

    It must report `Imported 0` and `Updated` equal to the number of games in the file, 4,000 since 18 October 2026, with the same number of practice games in the database. The one exception is the first load of the 4,000-game file on a server that still holds the first 500: it reports `Imported 3500` and `Updated 500`, and 4,000 in the database afterwards. Anything else means the server holds different games: stop and find out why before going on.
6. Run it again without `--dry-run`, in its own paste, keeping `-d memory_limit=512M`.
7. Check the version, in its own paste. It should print one line, the new version and the number of games, `6|4000` for version 6:

    ```bash
    docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select answers_version, count(*) from practice_games group by 1"'
    ```

8. Purge the Cloudflare cache: in the dashboard for the domain, **Caching → Configuration → Purge Cache**, either a custom purge of the hostname `chess.asanfa.com` or **Purge Everything**. Each game is cached for a day, by Cloudflare and by browsers. Without the purge, the old answers can be served for up to a day; browsers refresh their own copies within a day by themselves, so players need not do anything.
9. Delete the uploaded copy from `chess-imports`.

**Undo:** restore the backup from step 4 (section 9), then purge the Cloudflare cache again.

## Cloudflare cache rule for the data endpoints

Set up on 19 October 2026, as part of step 34. The data endpoints under `/api/` already send a public cache header (an hour for the lists, a day for one game or puzzle), but Cloudflare does not cache JSON on its own. This rule tells it to, so most game and puzzle requests are answered by Cloudflare and never reach the server. Error responses carry no public cache header, so a "not found" is never cached.

In the Cloudflare dashboard for the domain, **Caching → Cache Rules → Create rule**:

- **Rule name:** `chess-trainer api`
- **When incoming requests match:** Custom filter expression, **URI Full** · **wildcard** · `https://chess.asanfa.com/api/*`. The expression preview reads `(http.request.full_uri wildcard r"https://chess.asanfa.com/api/*")`.
- **Cache eligibility:** Eligible for cache
- **Edge TTL:** Use cache-control header if present, bypass cache if not
- **Browser TTL** and everything else: left as they are.

It touches nothing outside `/api/` on this subdomain, so the site's pages and other sites on the domain are unaffected.

**Check:** from any computer, twice (in PowerShell, `curl.exe`):

```bash
curl -sI https://chess.asanfa.com/api/practice-games/1 | grep -i cf-cache-status
```

You should see `cf-cache-status: MISS` the first time and `HIT` the second. `DYNAMIC` means the rule does not apply (a new rule can take a minute); `BYPASS` usually means the response set a cookie, which the data endpoints must never do.

After an import with `--update`, purge the cache as section 11 describes, or the old answers can be served for up to a day.

**Undo:** disable or delete the rule in **Caching → Cache Rules**.

**Other Cloudflare settings for the site**, confirmed on 19 October 2026 for step 34:

- **Encryption:** the domain as a whole is on **Full**, but the Configuration Rule **chess strict SSL** (**Rules → Configuration Rules**, Hostname equals `chess.asanfa.com`) sets **SSL** to **Full (strict)** for this site, so Cloudflare checks the server's Let's Encrypt certificate. Leave the domain-wide setting alone: other sites depend on it. If the certificate ever fails to renew, the site shows Cloudflare's error 526 until it is renewed.
- **Rocket Loader:** off for this site. It rewrites a page's scripts and breaks the app. Check that the page has no `rocket-loader` script (in PowerShell, `curl.exe -s https://chess.asanfa.com/ | Select-String "rocket-loader"` prints nothing). If it ever does, turn it off for this hostname only, with a Configuration Rule setting **Rocket Loader** to **Off**, since the main setting applies to the whole domain.

## Resource limits

The server is shared with other sites, so the app's use is capped: 768 MB of memory for the app container and 512 MB for Postgres, with no swap on top, and at most 16 Apache workers, which handle far more than the site needs. `docs/requirements.md` has the reasons, under Operations.

To see the current use:

```bash
docker stats --no-stream
```

You should see `chess-trainer-production-app-1` and `chess-trainer-production-postgres-1`, each with `MEM USAGE / LIMIT` such as `60MiB / 768MiB`. Leave out `--no-stream` to watch it live; Ctrl+C stops.

Signs that a limit is too low:

- `docker compose logs app | grep MaxRequestWorkers` shows `server reached MaxRequestWorkers setting`: all 16 workers were busy and requests queued.
- `journalctl -k | grep -i 'memory cgroup out of memory'` shows a process killed in a container for going over its memory limit.

Where to change them:

- Memory: `mem_limit` and `memswap_limit` (keep the two equal) for each service in `compose.production.yaml`.
- Workers: `MaxRequestWorkers` and `ServerLimit` (keep the two equal) in `deploy/docker/apache-server.conf`. Each worker can use up to PHP's `memory_limit` of 128 MB, though a request here uses far less, so raise the app's memory along with the workers.

Change them with a pull request, so that `main` matches the server, then deploy (section 10): `deploy.sh` rebuilds the image and recreates the containers with the new values. In an emergency, the app's memory can be raised at once; it lasts until the container is next recreated, for example by a deploy that changes the image, which sets the values from the file again:

```bash
docker update --memory 1g --memory-swap 1g chess-trainer-production-app-1
```

The imports in section 11 run inside the app container with `docker compose exec`, so they count against its 768 MB as well. Run them when the site is quiet.

## Follow-ups

- **Automatic deploys on merge.** `deploy.sh` is run by hand for now. Since there is no SSH access from outside, the simplest automatic version is pull-based: a systemd timer on the server that checks `origin/main` every few minutes and runs `deploy.sh` when it has moved. A GitHub Actions job that connects in would need SSH.
- Step 34 covers the rest of the launch: error tracking, analytics, the server firewall review, and a test restore of a backup (section 9 has the commands). The Cloudflare items of step 34, the cache rule, strict encryption and Rocket Loader off, were done or confirmed on 19 October 2026 (see "Cloudflare cache rule for the data endpoints").
