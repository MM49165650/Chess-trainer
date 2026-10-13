# Rules for coding agents

Read `docs/requirements.md` before starting any work. It is the specification.
The mockups in `docs/design/` show the intended look.

## Working rules

- Work on one build step at a time (see "Build order" in the requirements), and stop when its finish line is met.
- When the requirements are silent or contradict themselves, stop and ask. Do not guess.
- Run the check command before finishing: `docker compose run --rm app composer check`. Never finish with it failing.
- Before finishing any change to a play screen, run the fit test as well: `docker compose run --rm app composer check:fit`. It is not part of the check command and otherwise runs only in CI.
- Do not change the check configuration, the CI workflow or the licence file without approval, and do not add comments that silence a check.
- Design and review every screen at phone width first, about 390 pixels, in both light and dark mode.
- Use design tokens only. Do not hard-code colours in components.
- Do not add a dependency without stating its licence. It must be compatible with GPL-3.0.
- Never commit secrets, imported game or puzzle data, or database dumps.
- Do not add tests beyond the fixed set in the requirements unless asked.
- Do not add features that are not in the requirements. There are no accounts and no login.
- Keep all chess logic in the shared TypeScript chess code. None goes in PHP.
- Never write code that deletes or reloads imported content. Game and puzzle IDs must stay stable.

## Laravel Boost

- Laravel Boost is installed for its tools only (see `.mcp.json`). Its generated guidelines and skills are switched off in `boost.json`. Do not switch them on and do not run `boost:install`.
- The tools run inside Docker, so the containers must be running first: `docker compose up -d`. Without them the tools do not start.
- Use the `search-docs` tool before relying on a Laravel, Inertia, Pest or Wayfinder API. It searches the documentation for the installed versions.
- Do not rely on PHP or Node being installed on the host. Run every command through the container, for example `docker compose exec app php artisan route:list`.
- Do not use the `record-rule` tool. Project rules live only in this file and in `docs/requirements.md`.

## Known pitfalls

- The route `/guess/{master}/random` must be registered before `/guess/{master}/{game}`, and `{game}` must accept digits only.
- Chessground can report castling as the king moving onto the rook. Normalize it to the king's two-square move before comparing.
- The data endpoints must not start a session or set a cookie, or Cloudflare will not cache them.
- The control calculation must not use the rules library's own attack helpers. It follows Appendix B of the requirements.
- Pawn pushes, castling and promotion are where the control rules are easiest to get wrong. Each has a golden test.
