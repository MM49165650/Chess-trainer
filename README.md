# Chess trainer

A free, open source, mobile-first chess training site focused on beginners with four modes:

- **Guess the move**: play through a master's win and guess each move.
- **Square control**: after every move of a beginner game, mark the squares the piece gave up and the squares it controls now.
- **Spot the hanging piece**: after every move of the same games, mark every piece left hanging, on either side.
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

- The first stage reads PGN files, replays every game and prints what it kept and what it skipped. `--input` takes one file or a folder. Single games can be left out by adding their fingerprint to `tools/import/masters-exclude.json`.
- The second stage loads the result into the database. It is safe to run again: games already loaded are skipped and keep their IDs. Add `--dry-run` to see the report without changing anything, or `--update` to rewrite the details of games already loaded.

## Importing puzzles

The puzzles come from the Lichess puzzle file, `lichess_db_puzzle.csv.zst`. Put it under `data/puzzles/` and leave it compressed. The import runs in the same two stages:

```bash
docker compose exec app npm run extract:puzzles -- --input data/puzzles --out data/intermediate/puzzles.jsonl
```

```bash
docker compose exec app php artisan import:puzzles data/intermediate/puzzles.jsonl
```

- The first stage reads the file while it is still compressed and takes a few minutes. It keeps puzzles of two solver moves made by the same piece, where the last move is a capture and not checkmate, and then the 2,000 most popular per piece. `--max-rating`, `--min-popularity`, `--min-plays` and `--per-category` change the limits.
- The second stage is safe to run again: puzzles already loaded are skipped and keep their IDs. `--dry-run` and `--update` work as for master games.

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

### The fit test

A second command opens the four play screens in a headless browser at four phone sizes and fails if a screen scrolls or its board is too narrow. It takes about a minute, so it runs in CI and on demand, not before each commit:

```bash
docker compose run --rm app composer check:fit
```

It needs the browser that is part of the Docker image. After pulling a change to the `Dockerfile`, rebuild the image with `docker compose build` and run `composer setup` again.

## Licence

GPL-3.0. See [`LICENSE`](LICENSE). Third-party assets such as piece sets keep their own licences.
