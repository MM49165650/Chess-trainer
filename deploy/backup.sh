#!/usr/bin/env bash
# Dumps the database into the backup folder and keeps the newest 14 dumps.
# Run nightly by /etc/cron.d/chess-trainer, and by deploy.sh before every
# deploy. See "Backups" in docs/deployment.md.
#
# Run as root:  bash /opt/chess-trainer/deploy/backup.sh

set -euo pipefail

# The Hestia user whose home holds the dumps, so that Hestia's own backups
# and its file manager can reach them. Set in the environment; there is no
# default.
if [ -z "${HESTIA_USER:-}" ] || ! id -u "$HESTIA_USER" > /dev/null 2>&1; then
    echo "HESTIA_USER is not set to a user on this server. See section 0 of docs/deployment.md." >&2
    exit 1
fi
BACKUP_DIR="/home/$HESTIA_USER/chess-trainer-backups"
KEEP=14

cd "$(dirname "$0")/.."

install -d -m 700 -o "$HESTIA_USER" -g "$HESTIA_USER" "$BACKUP_DIR"

file="$BACKUP_DIR/chess-trainer-$(date -u +%Y%m%d-%H%M%S).dump"
trap 'rm -f "$file.partial"' EXIT

docker compose -f compose.production.yaml exec -T postgres \
    sh -c 'pg_dump --format=custom --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
    > "$file.partial"

mv "$file.partial" "$file"
chown "$HESTIA_USER:$HESTIA_USER" "$file"
chmod 600 "$file"

# The names sort by date, so everything after the newest $KEEP goes.
find "$BACKUP_DIR" -maxdepth 1 -name 'chess-trainer-*.dump' -printf '%f\n' \
    | sort -r | tail -n +$((KEEP + 1)) \
    | while read -r old; do rm -f -- "${BACKUP_DIR:?}/${old:?}"; done

echo "$(date -u '+%Y-%m-%d %H:%M:%S') backed up to $file ($(du -h "$file" | cut -f1))"
