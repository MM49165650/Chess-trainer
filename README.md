# Chess trainer

A free, open source, mobile-first chess training site focused on beginners with three modes:

- **Guess the move**: play through a master's win and guess each move.
- **Square control**: after every move of a beginner game, mark what changed on the board.
- **Tactics by piece**: one- and two-move tactics, grouped by the piece that plays them.

The site is being built step by step. So far there is only a placeholder home page.

- [`docs/requirements.md`](docs/requirements.md): the product and technical requirements, including the build order.
- [`docs/design/`](docs/design/): mockups of the chosen visual direction.
- [`AGENTS.md`](AGENTS.md): working rules for AI coding agents.

## Run locally

You need Docker and nothing else. PHP 8.4, Node 24 and Postgres 18 all run in containers.

```bash
cp .env.example .env
```

```bash
docker compose run --rm app composer setup
```

```bash
docker compose up
```

Then open <http://localhost:8000>.

- `composer setup` installs the PHP and Node packages, creates the application key, runs the migrations and adds the eleven masters. It is only needed once, and again after the dependencies change.
- To run any other command, prefix it with `docker compose exec app`, for example `docker compose exec app php artisan migrate`.
- `vendor/` and `node_modules/` are kept in Docker volumes, not in the project folder, so the project stays fast on Windows. An editor on the host will not see them.

## Importing master games

Game files are never committed. Put them under `data/`, which git ignores. An import runs in two stages:

```bash
docker compose exec app npm run extract:masters -- --input data/masters --out data/intermediate/master-games.jsonl
```

```bash
docker compose exec app php artisan import:master-games data/intermediate/master-games.jsonl
```

- The first stage reads PGN files, replays every game and prints what it kept and what it skipped. `--input` takes one file or a folder.
- The second stage loads the result into the database. It is safe to run again: games already loaded are skipped and keep their IDs. Add `--dry-run` to see the report without changing anything, or `--update` to rewrite the details of games already loaded.

## The check command

One command runs every check: Pint, Rector, Larastan, the Pest tests, the TypeScript checker, ESLint, Stylelint, Prettier, Vitest, the dependency licence check and a scan for comments that silence a check.

```bash
docker compose run --rm app composer check
```

`docker compose run --rm app composer fix` applies the automatic fixes from Rector, Pint and Prettier.

CI runs the same command on every pull request and on `main`. To run it before each commit as well, together with a secret scan of the staged changes, switch the hook on once per clone:

```bash
git config core.hooksPath .githooks
```

## Licence

GPL-3.0. See [`LICENSE`](LICENSE). Third-party assets such as piece sets keep their own licences.
