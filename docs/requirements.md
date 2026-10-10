# Chess training site: product requirements

Last updated: 10 October 2026

A free, open source, mobile-first chess training site with three modes: guess the move against seven masters, a square-control drill on beginner games, and short tactics grouped by piece. The MVP has no accounts, and all progress is kept in the browser.

## MVP scope

The MVP is three training modes served from a read-only library, with nothing to log in to. The site is free, not intended to make money beyond possible donations, and its code is public.

**In the MVP**

- Guess the move, with games from seven masters
- Square control, on games by players rated under 1000
- Tactics by piece, one or two moves long
- Progress, history and settings saved in the browser
- Command-line imports for all game and puzzle data
- A mobile-first interface

**Not in the MVP**

- Accounts, sign-up or login of any kind
- An admin panel
- A daily game, streaks, or leaderboards
- Groups or any multiplayer feature
- Export or import of progress between devices
- Partial credit or engine evaluation of moves
- A puzzle rating for the user
- Puzzle theme labels (fork, pin and so on)
- Any anti-cheating measure

**Principles**

- Answers are checked in the browser. Cheating only affects the cheater, so nothing is hidden on the server.
- All chess logic runs once, at import. The server stores positions and expected answers and never calculates chess rules at request time.
- Scoring is exact match everywhere.

## Mode 1: Guess the move

The user picks a master game and guesses every move the winner played, starting from move 1.

**Masters**

Seven masters, chosen because their styles work well together: Morphy, Capablanca, Alekhine, Botvinnik, Tal, Fischer and Spassky. They are not grouped by era.

- Each game is filed under its winner. Capablanca beating Alekhine appears under Capablanca only.

**Play**

- The user guesses the winner's moves. The opponent's moves play automatically after a delay the user sets, from 1 to 10 seconds.
- Guessing starts at move 1. If the winner had Black, White's first move plays automatically.
- One attempt per move. After the guess, right or wrong, the actual move is played and the game continues.
- Only legal moves can be made on the board. A promotion shows a piece picker, and the guess includes the promotion piece.
- Feedback on a wrong guess is the user's move shown against the master's move.
- The board is oriented to the winner's side, and the last move played is highlighted.
- Progress is saved after every move, so closing the tab and returning resumes at the same position.
- Several games can be in progress at once, each resumable.
- A finished game can be replayed. The new score replaces the old one.

**Scoring**

- The score is correct guesses out of total guesses, for example 23/34.
- A move is correct only if it matches the move played. Moves are compared by from-square, to-square and promotion piece, not by written notation.

**End of game**

- The score
- A spoiler-free share summary: game name, score, and a row of right/wrong squares, one per move
- A replay of the full game with the user's guesses marked

**Browsing**

- Each master has a list of games showing opponent, year, event, number of moves, and the user's score if played.
- Games the user has started but not finished show an in-progress marker.
- The list has paging, a search box that matches opponent and event, and filters for year and colour.
- Each master has a random game button.

**Import rules**

- The winner must be one of the seven masters.
- Draws are excluded.
- Odds games, which start from a non-standard position, are excluded.
- Simultaneous and blindfold exhibition games are excluded where the data labels them.
- Games below a minimum length are excluded.
- Duplicate games are removed.
- Player names are normalized so each master has one spelling.
- Annotations and commentary are stripped; only moves and basic details are kept.
- Every game is replayed, and any game with an illegal move is rejected.

## Mode 2: Square control

The user watches a beginner game one move at a time and, after every move, marks what changed on the board in three phases.

**Games**

- Games come from the Lichess open database, from players rated under 1000.
- Usernames are removed at import.
- The user goes through the whole game move by move, starting at move 1. These are not isolated puzzles.
- Moves are shown, not guessed. Every move by either side is an exercise.

**The three phases**

Each phase is marked and submitted separately, in this order.

| Phase | The user marks | Rule |
| --- | --- | --- |
| 1. Squares lost | Squares the moved piece no longer controls | Controlled before the move and not after |
| 2. Squares controlled | Squares the moved piece now controls | Every square it controls after the move, including ones it already controlled |
| 3. Hanging pieces | Every hanging piece and pawn on the board | Judged after the move, for both sides |

**Definitions**

These rules are the specification for the import code and its tests.

| Term | Definition |
| --- | --- |
| Control | A piece controls every square it attacks, judged purely by geometry |
| Occupied squares | A controlled square may hold a piece of either colour; controlling a friendly piece means defending it |
| Rooks, bishops, queens | Control runs up to and including the first piece in the way |
| Pawns | Control their two forward diagonal squares only, never the squares they push to |
| Pins | Ignored for both control and hanging |
| Hanging | Attacked by at least one enemy piece and defended by no friendly piece |
| Hanging: scope | Pieces and pawns of both sides; kings are excluded |

**Consequences of the rules**

- The destination square belongs in phase 1, because the piece controlled it before the move and now stands on it.
- Pawn pushes are the exception that follows from the rule: a pawn never controlled the square it pushes to, so that square is not marked. A pawn capture's destination is marked.
- Castling counts the king and the rook together in phases 1 and 2. A square may then appear in both phases, lost by one piece and controlled by the other.
- Promotion: phase 1 uses the pawn's squares, phase 2 uses the new piece's squares.
- A hanging piece is marked again on every move for as long as it stays hanging.
- An empty submission is valid. Many positions have no hanging pieces.

**Worked example**

A rook moves from a1 to a4 on an otherwise empty board.

- Before: it controls a2 to a8 and b1 to h1.
- Phase 1 answer: b1 to h1, plus a4.
- Phase 2 answer: a1 to a3, a5 to a8, and b4 to h4.

**Scoring and feedback**

- Each phase has its own score: 1 if the selection is exactly right, 0 otherwise. Missed squares and wrongly marked squares both fail the phase.
- The user sees three running percentages, one per phase, to show which skill is weakest.
- Tallies are also kept by the type of piece that moved.
- Feedback appears after each phase is submitted: missed squares are highlighted, and wrongly marked squares are shown in a second colour.

**Sessions**

- Sessions are open-ended. The user goes for as long as they like, and returning resumes at the same move.
- A next game button serves a random game. There is no browsing. The mode opens on a landing page at /squares that shows the three phase percentages and a Start or Resume button. The exercise itself runs at /squares/play.
- The board is shown with White at the bottom.
- A rewind button shows the position before the move. The move's squares are not highlighted in this mode. Phase 1 depends on that earlier position, and a user resuming a session did not just watch the move.

## Mode 3: Tactics by piece

The user solves short tactics grouped by the piece that delivers them.

**Categories**

- Six categories: pawn, knight, bishop, rook, queen, king.
- An all pieces option draws puzzles from every category.
- The king category covers tactics such as capturing an undefended piece with the king.
- A puzzle is filed under the piece that makes the solving moves.

**Puzzles**

- Puzzles come from the Lichess puzzle database.
- A puzzle is one or two solver moves long. In a two-move puzzle, the same piece makes both moves.
- One-move and two-move puzzles are mixed together within a category.
- A pawn that promotes and then moves again counts as the same piece, and the puzzle is filed under pawn.
- Castling, if it appears, counts as a king move.
- Only well-rated, widely played puzzles are imported, using the popularity figures in the data.

**Play**

- The opponent's previous move plays first, so the user sees what just happened.
- The board is oriented to the solver's side, only legal moves can be made, and the last move played is highlighted.
- In a two-move puzzle, the opponent's reply plays automatically after a correct first move.
- When the final move is checkmate, any move that delivers checkmate is correct.
- A wrong move fails the puzzle. The user can then retry until they find the answer.
- A show solution button is available after a failure.
- A puzzle the user has seen is not served again until the category runs out. The seen list for that category then resets.

**Scoring**

- Each puzzle is solved or failed, decided by the first attempt.
- The user sees running tallies per piece category.
- There is no rating for the user.

## Site-wide requirements

Most users are on phones, so phone width is the primary design target for every screen.

**Mobile**

- The board spans the full screen width, with all controls below it within thumb reach.
- A fixed bar at the bottom holds the main action: the phase indicator and submit button in square control, and the equivalent controls in the other modes.
- Squares are tapped to mark them in square control, with no zooming needed.
- Moves can be made by tapping a piece and then a square, or by dragging.
- Nothing depends on hovering, and the page does not scroll while a piece is dragged.
- Game lists are rows separated by hairlines, with filters in a slide-up panel.
- Data loads on demand, one game or puzzle batch at a time, to stay fast on mobile data.

**Pages**

- Home, with the three modes
- A landing page per mode
- A progress page with the user's stats: guess-the-move scores by master, the three square-control percentages, and tactics tallies by piece
- Settings
- About, at `/about`: what the site is, how the three modes work, and that it is free and open source
- Credits, with a link to the source code
- Privacy, a short page saying that progress is stored only in the browser and that Cloudflare analytics is used

**Settings**

- Appearance: light, dark, or match the device
- Board theme and piece set, taken from Lichess's collection, starting with three or four of each. The default board is Lichess's olive board and the default piece set is Lichess's Maestro
- Sound on or off. The sound source is undecided: Lichess's licence file lists most of its sounds as exceptions without a free licence, so they are not used unless that is cleared
- Move input: tap, drag, or both
- Opponent move delay in guess the move: 1 to 10 seconds in whole seconds, default 3
- Marking colours for square control, including at least one colour-blind-friendly palette

**Progress**

- All progress, history and settings are stored in the browser using IndexedDB, in a versioned format so they can be uploaded to an account later.
- Clearing browser data or switching devices loses progress. This is accepted for the MVP.
- Safari erases a site's stored data after seven days without a visit. Installing the site to the home screen avoids this, and the progress page explains how.

**Other**

- A reset progress button in settings, with a confirmation step.
- When a game or puzzle fails to load, the user sees a clear message and a retry button.
- Every exercise has a report a problem link that opens a GitHub issue pre-filled with the game or puzzle and the move number.
- The site is in English only.

## Visual design

The site has to be beautiful, in a light mode and a dark mode. The chosen look is direction A, "Study", from the mockup canvas: a chess book, with warm paper, hairline rules and no cards.

**Modes**

- Two modes: light and dark. There is no third mode for now.
- The user picks light, dark, or match the device. The default is to match the device.
- Light mode uses warm off-whites with dark grey text. Pure white is not used.
- Dark mode uses deep greys with off-white text and slightly muted accent colours. Pure black is not used.
- Both modes must be easy on the eyes and still readable: body text meets the standard accessibility contrast ratio of 4.5 to 1.

**Principles**

- The board is the centrepiece. Everything around it is quiet, with one accent colour and few borders.
- Each mode has a matching default board theme, so the board never clashes with the page.
- The square-control marking colours must be clear in both modes and on every board theme.
- One or two typefaces, with care for numbers, since scores and tallies appear everywhere.
- Motion is quick and subtle.

**Chosen direction: Study**

- Headings are set in Newsreader, a serif. Body text and controls are set in Instrument Sans. Both font files are served from the site's own server, not from Google, so no visitor request goes to a third party; their licences are checked when the files are downloaded.
- Sections are separated by hairline rules and spacing, not by cards or shadows.
- Small labels are uppercase with wide letter spacing. Scores use tabular figures.
- The board runs edge to edge on a phone. The default is Lichess's olive board with the Maestro piece set.
- Primary buttons are pill-shaped and filled with the accent colour.

| Token | Light | Dark |
| --- | --- | --- |
| Page background | `#F3EFE6` | `#1B1A17` |
| Raised surface | `#FBF8F1` | `#24231F` |
| Text | `#2A2824` | `#E9E4D8` |
| Muted text | `#6B665C` | `#A39D8F` |
| Hairline | `#DDD6C7` | `#35332D` |
| Accent | `#2E6A4F` | `#86BC9C` |
| Wrong guess | `#C98A6B` | `#A8644A` |
| Board, light squares | `#ECE6D6` | `#B7B3A2` |
| Board, dark squares | `#8DA084` | `#65755E` |
| Last move, light squares | `#E3DC9A` | `#C9C27A` |
| Last move, dark squares | `#A9B36A` | `#8E9A52` |

The four board rows in this table describe the sage board drawn in the mockups, which is no longer the default. With the olive board as the default, the last-move highlight and the square-control marking and feedback colours are checked against olive in both modes in build step 9, and adjusted there if they do not read clearly.

**Square-control marking**

| Phase colour | Light | Dark |
| --- | --- | --- |
| Lost | `#A66A0C` amber | `#E3A64A` amber |
| Controls | `#2B66A6` blue | `#8EC0EE` blue |
| Hanging | `#A03A78` magenta | `#D98BBB` pink |

- While marking, a marked square has a half-transparent fill in the phase colour and a solid 3 px border in a darker shade of it.
- After a phase is submitted, the three kinds of square differ in shape as well as colour, so they read without colour vision.

| Square | Drawn as |
| --- | --- |
| Correct | Blue fill with a solid border, the same in all three phases |
| Missed | Dashed blue border, no fill |
| Wrong | Red fill `#BE3232` with a solid `#8A1C1C` border |

- A legend under the board counts correct, missed and wrong squares, and the main button moves to the next phase.
- In dark mode, feedback follows the same rule with lighter shades: blue #8EC0EE for correct and missed, and a red near #E58A8A for wrong. The dark values have not been drawn in a mockup and are confirmed on the dark board in build step 9. All values come from the mockups and are a starting point: each is checked for contrast when the tokens are built.
- The mockups are saved as images in the repository under `docs/design/`, because the building agent only sees what is in the repository.

**How it is enforced**

- Every colour, font size, spacing step and corner radius is a named design token, defined in one place. A mode is a different set of values for the same names.
- Components use tokens only. A lint rule rejects hard-coded colours.
- A small set of shared components is built before any screen: button, list row, bottom bar and slide-up panel. There is no card component.
- Every screen is reviewed on a phone in both modes before its build step is finished.

## Data and imports

All content is loaded by command-line import, one command per mode. Nothing can be added through the website. Appendix E has the exact commands, options and file format.

| Mode | Source | Stored per item |
| --- | --- | --- |
| Guess the move | Game files of the seven masters | Game details, and the full move list stored on the game |
| Square control | Lichess open database | Game details, and one list on the game holding each move with its three answer sets |
| Tactics by piece | Lichess puzzle database | The position, the solution moves, the piece category, and the puzzle's rating |

**Every import command**

- Takes a file or a folder of files.
- Is safe to rerun. Importing the same data twice adds nothing new.
- Verifies every game or puzzle by replaying it, and rejects any with an illegal move.
- Prints a report: how many were imported, how many were skipped, and why.
- Has a dry-run option that prints the report without changing anything.

**Rules**

- Every game and puzzle has a stable ID that never changes once assigned. A move is identified by its game and its move number. An import recognizes items it has already loaded and leaves them in place; it never deletes and reloads them. Later features such as comments and multiplayer sessions will point at these IDs.
- All chess calculation, including the control and hanging-piece sets, happens at import.
- Imported game data, with its answers, lives in the database and is not committed to the repository.
- Imports run in two stages, described in Appendix E. The first stage is written in TypeScript and uses the same chess rules library as the browser, so the project has one chess implementation.

**Decision: moves are stored on the game**

A game's moves are stored as one list on the game's row, not as one database row per move. This was chosen on 10 October 2026 as the simpler option, because answers are checked in the browser and the server only ever hands out whole games. If comments on moves or server-side checking are added later, they can refer to a move by game and move number, or the list can be split into rows with a migration at that point.

## Technical stack and guardrails

The codebase is written mainly by AI agents, so conventions are enforced by checks that fail, not by documentation.

**Stack**

| Layer | Choice |
| --- | --- |
| Backend | Laravel |
| Database | Postgres |
| Frontend | Vue with TypeScript |
| Backend-to-frontend link | Inertia |
| Chess board | Chessground, the Lichess board, wrapped in one Vue component |
| Chess rules | chess.js, in the browser and the import scripts |
| Environment | Docker, with the same versions locally and in CI |
| Cache, sessions, queues | Postgres. Redis is not used. |

For the MVP the server serves read-only data. Laravel and Postgres are kept so accounts can be added later without changing stack.

**Technical decisions**

- Hosting: a Hetzner server running Docker, with Cloudflare in front for caching, HTTPS and analytics.
- Browser storage: IndexedDB.
- Installable: the site can be added to the phone's home screen. There is no install prompt on the first visit; the option is mentioned only on the progress page.
- Data delivery: Inertia handles pages and navigation. Game and puzzle data come from separate data endpoints, cached for a long time because a game never changes.
- TypeScript tests: Vitest, run by the check command. The control and hanging-piece golden tests are TypeScript, since that logic runs in the import scripts.
- Search engines: master game pages are rendered on the server so search engines can read them.
- Analytics: Cloudflare Web Analytics, which uses no cookies.
- Large Lichess files and the source of master games are decided when the imports are built.

**Guardrails**

- One check command runs everything below, in CI and before each commit.
- PHP: strict types in every file, Larastan at a high level with no baseline, Pint, Rector, and Pest architecture tests.
- Laravel: strict models, destructive database commands blocked in production.
- Postgres: foreign keys, not-null, unique and check constraints throughout. Tests run against real Postgres.
- TypeScript: strict mode, with lint rules banning the escape hatches such as `any`.
- Boundary: TypeScript types and route helpers are generated from the PHP side, and the check fails if they are out of date.
- Agent instructions state that phone width is the primary target and that the check command must pass.
- Changes to the check configuration itself need human review.

**Tests that matter most**

- Tests are kept to a small fixed set. There is no general unit-testing practice and no coverage target; the static checks cover the rest.
- Golden tests for the control and hanging-piece rules: fifteen to twenty hand-verified positions covering every definition and consequence listed under square control. These are written before the import code, because errors there store wrong answers without any visible failure.
- Import twice and confirm every game and puzzle keeps the same ID.
- Import a handful of real games that include castling, promotion and en passant, and confirm they replay correctly.

**Operations**

- Production runs with debug mode off.
- Automated database backups, tested by restoring once.
- Error tracking for production exceptions.

## Licensing and the public repository

The whole repository is public under GPL-3.0 from the first commit, because Chessground is GPL-3.0 and the frontend ships with it. This is not legal advice; read the licence terms before launch.

**Requirements**

- A GPL-3.0 licence file in the repository, with Chessground's copyright notices kept intact.
- The public code matches what is deployed.
- A source code link in the site footer.
- Every bundled frontend package has a GPL-compatible licence. A CI step lists dependency licences and fails on unapproved ones.
- Board themes, piece sets and sounds each have their own licence. Check each one used and credit its author. Maestro, the default piece set, is by sadsnake1 under CC BY-NC-SA 4.0: it requires credit, forbids commercial use, and is kept in its own folder with its own licence notice, outside the GPL-3.0 code. Lichess's board images are AGPL-3.0 or later.
- Lichess is credited for the board and for the game and puzzle data, following the terms of each data set.

**Kept out of the repository**

- The environment file and every credential
- Imported game and puzzle data
- Database dumps and backups

**Protection**

- Secret scanning with push protection on GitHub, plus a scanner before each commit.
- Automated alerts for vulnerable dependencies.
- Seeders and tests use made-up data only.
- A secret that is ever committed is treated as exposed and replaced at once, since history is permanent.

## Build order

The build is 34 steps in six stages. Each step is one request to an agent, with a finish line to check before the next step begins. Guess the move is built first among the modes so it becomes the pattern the others copy.

**Stage 1: Foundation**

| Step | Build | Done when |
| --- | --- | --- |
| 1. Repository | The starter kit with Vue, Inertia and TypeScript, with its login and registration pages removed; Docker for PHP, Node and Postgres; the GPL-3.0 licence file; a public GitHub repository with secret scanning | The home page loads in Docker from a fresh clone |
| 2. Check command and CI | Pint, Larastan, Rector, Pest architecture tests, the TypeScript checker, ESLint, Vitest and the licence check, behind one command; CI and a pre-commit hook that run it | CI passes on the empty app and fails on a deliberate violation of each tool |
| 3. Agent setup | This document saved as `docs/requirements.md`; `AGENTS.md` written from Appendix H; Laravel Boost installed | An agent given a trivial task reads both files and runs the check command |
| 4. First deployment | The Hetzner server with Docker; Cloudflare in front with trusted forwarding headers; debug mode off; database backups | A merge to the main branch puts a placeholder home page on the public address |

**Stage 2: Chess core**

| Step | Build | Done when |
| --- | --- | --- |
| 5. Conventions | Shared types and helpers for squares, moves and pieces, as in Appendix A | The types pass the check and are used by one sample function |
| 6. Golden positions | A data file of positions, each with a move and its expected `lost`, `controlled` and `hanging` answers, written and verified by you | Fifteen to twenty positions exist, including the four examples in this document |
| 7. Calculation | The attack sets and the steps in Appendix B | Every golden test passes |
| 8. Board component | The Vue wrapper around Chessground: showing a position, legal moves only, tap and drag, the promotion picker, board orientation, last-move highlight that can be switched off, and the square-marking layer | A demo page works on a real phone for a move, a promotion, and marking squares |
| 9. Design tokens and components | The light and dark tokens from the Visual design section; the two typefaces; the lint rule against hard-coded colours; the shared components: button, list row, bottom bar and slide-up panel; the mockups saved as images under docs/design/ | A sample page with every component matches the mockups in both modes on a phone, and the lint rule rejects a hard-coded colour |

**Stage 3: Guess the move**

| Step | Build | Done when |
| --- | --- | --- |
| 10. Tables | Migrations for `masters` and `master_games`, and the seeder for the seven masters | Migrations run, and the constraints reject a deliberately bad row |
| 11. Import on a sample | `extract:masters` and `import:master-games`, run on about twenty games | The games load, a second run adds nothing and changes no ID, and the report lists what was skipped |
| 12. Data endpoint | `GET /api/master-games/{id}` with its generated TypeScript type | The response matches Appendix F, carries the cache header, and sets no cookie |
| 13. Play screen | Guessing through one game: the opponent delay, one attempt per move, feedback, and the running score. Nothing is saved yet | A full game can be played on a phone |
| 14. Saving | The storage module; resuming; several games in progress; replaying | Closing and reopening the browser resumes a game mid-way |
| 15. End of game | The score, the replay with guesses marked, and the share summary | A finished game can be reviewed and shared from a phone |
| 16. Browsing | The masters page; the game list with search, filters, paging, scores and in-progress markers; the random game button | A specific game can be found and started in a few taps |
| 17. Search engines | Server rendering for master and game pages, their titles and descriptions, and the sitemap | A game page's source shows its title and description with scripts disabled |
| 18. Full import | All master games loaded on the server | Needs two open decisions: the game source and the minimum length |

**Stage 4: Tactics by piece**

| Step | Build | Done when |
| --- | --- | --- |
| 19. Table and import on a sample | The `puzzles` migration; `extract:puzzles` and `import:puzzles`, run on a sample of the Lichess file | The sample loads, every two-move puzzle obeys the same-piece rule, and a second run adds nothing |
| 20. Endpoints | The puzzle ID list and the fetch-by-IDs endpoint | Both match Appendix F |
| 21. Play screen | The setup move, the one-move and two-move flows, the checkmate rule, fail then retry, and show solution | Puzzles of both lengths can be solved and failed on a phone |
| 22. Categories and progress | The category page with the all pieces option; seen tracking; tallies; the reset when a category runs out | No puzzle repeats within a category until it is exhausted |
| 23. Full import | All puzzles loaded on the server | Needs one open decision: puzzle difficulty |

**Stage 5: Square control**

| Step | Build | Done when |
| --- | --- | --- |
| 24. Table and import on a sample | The `practice_games` migration; `extract:practice` with the calculation from step 7; `import:practice-games` | The sample loads, and neither the intermediate file nor the database holds a username |
| 25. Answer viewer | A development-only page that steps through an imported game and shows the three stored answers on the board | You have checked several games by eye and found no wrong answer |
| 26. Marking screen | The three phases on one game: tap to mark, submit, feedback showing missed and wrong squares, and the rewind button. Nothing is saved yet | A full game can be worked through comfortably on a phone |
| 27. Session | Next game; resuming at the exact move and phase; seen games | Closing and reopening the browser resumes at the same phase |
| 28. Tallies | The three phase scores and the tallies by piece | The numbers match a session counted by hand |
| 29. Full import | All practice games loaded on the server | Needs one open decision: game selection |

**Stage 6: Finish**

| Step | Build | Done when |
| --- | --- | --- |
| 30. Progress page | Stats for the three modes, the install note, the Safari note, and reset progress | The page matches what was played, and reset clears it |
| 31. Settings | Board themes, piece sets, sound, move input, opponent delay, and marking palettes | Each setting takes effect at once and survives a reload |
| 32. Installable | The web app manifest and icons | The site installs to a phone's home screen, and the iPhone carry-over question is answered by a test |
| 33. Remaining pages and states | About, credits, privacy, the report a problem links, and loading and failure states | Every page exists, and a failed load shows a retry button |
| 34. Launch check | Licences and credits; the Cloudflare cache rule, strict encryption, Rocket Loader off, and the server firewall; analytics; error tracking; a test restore of a backup | Every item is confirmed on the live site |

## Open decisions and later features

Six decisions are still open. None of them blocks starting the build.

**Open decisions**

| Decision | Applies to | What needs deciding |
| --- | --- | --- |
| Game selection | Square control | Whether both players must be under 1000, whether fast time controls are excluded, minimum length, and how many games |
| Puzzle difficulty | Tactics by piece | Whether to cap puzzle rating, and whether puzzles are served randomly or easiest first |
| Minimum game length | Guess the move | The number of moves below which a master game is excluded |
| Source of master games | Guess the move | Which game collection to import, and its terms of use |
| Progress after installing on iPhone | Whole site | Whether progress made in Safari carries over to the installed version; needs a test on a real phone |
| Name and domain | Whole site | What the site is called |

**Later features**

- Accounts, with browser progress uploaded at sign-up
- Comments on master games, attached to a game or a specific move; needs accounts and moderation
- Guess the move with multiple players; needs accounts and guesses saved on the server
- An admin panel for curating games
- A daily game with streaks, picked from the existing library
- Leaderboards, which need answers checked on the server and would start fresh from that point
- A featured set of famous games shown first for each master
- Puzzle theme labels
- Automated browser tests at phone size for the three core flows
- More board themes and piece sets

## Appendix A: Conventions

The import scripts, the database, the data endpoints and the browser all use the formats below. Nothing converts between formats at a boundary.

| Thing | Format | Example |
| --- | --- | --- |
| Square | Lowercase square name | `e4` |
| Set of squares | Array of square names, no duplicates, sorted alphabetically | `["a4", "b1", "c1"]` |
| Move | From-square, to-square, then a promotion letter (`q`, `r`, `b`, `n`) if any | `e2e4`, `e7e8q` |
| Castling move | The king's start and end squares | `e1g1` |
| Written move | Standard notation from the rules library, for display only | `Nf3`, `O-O`, `e8=Q#` |
| Colour | `white` or `black` |  |
| Piece type | Full lowercase name | `pawn`, `knight`, `bishop`, `rook`, `queen`, `king` |
| Position | FEN string |  |
| Ply | Half-move number starting at 1; odd plies are White's | Ply 1 is White's first move |
| Phase name | `lost`, `controlled`, `hanging` |  |
| ID | Integer assigned by the database |  |

**Rules**

- Squares are names, not numbers. Chessground and chess.js both use names, so no numbering scheme is needed.
- Two moves are equal when their from-square, to-square and promotion letter are equal. Written notation is never compared.
- A board may report castling as the king moving onto its rook. That is normalized to the king's two-square move before any comparison.
- Every game starts from the standard starting position. Anything else is rejected at import.
- Two sets are equal when they hold the same squares. Sorting only keeps stored data stable between imports.
- Each data shape is defined once, as a PHP data class, and its TypeScript type is generated. This includes the entries inside the `moves` lists.

## Appendix B: The control and hanging calculation

This is the exact procedure the import follows for every move of a practice game. It turns the definitions under Mode 2 into steps.

**The attack set of one piece**

The attack set of a piece on a square, in a given position, is:

- Knight: the up to eight knight-jump squares that are on the board.
- King: the up to eight adjacent squares.
- Pawn: the two squares diagonally forward, where they are on the board.
- Bishop, rook, queen: along each of its lines, every square up to and including the first occupied square.

The colour of a piece standing on an attacked square does not matter. A piece's own square is never in its attack set. Pins, checks and whose turn it is are ignored.

**Steps for one move**

Call the position before the move B and the position after it A.

1. Before set: the attack set of the moving piece on its start square, in B.
2. After set: the attack set of the piece now on the destination square, in A. For a promotion this is the new piece.
3. `lost` is the before set minus the after set.
4. `controlled` is the after set.
5. Castling: do steps 1 to 3 separately for the king and for the rook. `lost` is the two lost sets combined, and `controlled` is the two after sets combined.
6. `hanging`: look at every piece and pawn in A, of both colours, except the kings. It is attacked if its square is in the attack set of at least one enemy piece, pawn or king. It is defended if its square is in the attack set of at least one other piece, pawn or king of its own colour. If it is attacked and not defended, add its square.
7. `piece` is the type of the moving piece before the move. For castling it is `king`.

**Notes**

- A captured piece is gone in A, which can lengthen a line.
- In an en passant capture, the captured pawn is removed from its own square. A pawn that could only be taken en passant is not attacked by that pawn.
- The piece that just moved can itself be hanging.
- Every move is calculated, including the last move of the game.
- The attack function is the project's own code, working on a plain map of squares to pieces. The rules library is used only to replay games and check legality, so the behaviour is fixed by the golden tests and not by a library's interpretation.

**Example: a pawn push**

From the starting position, White plays `e2e4`.

- `lost`: `d3`, `f3`
- `controlled`: `d5`, `f5`
- `hanging`: none

The destination `e4` is not in `lost`, because the pawn never attacked it.

**Example: a hanging pawn**

After `e2e4`, `e7e5`, White plays `g1f3`.

- `lost`: `e2`, `f3`, `h3`
- `controlled`: `d2`, `d4`, `e1`, `e5`, `g1`, `g5`, `h2`, `h4`
- `hanging`: `e5`, which the knight attacks and no black piece defends

**Example: castling**

White has the king on e1, a rook on h1, the queen on d1, and pawns on d2, e2, f2, g2 and h2. The squares f1 and g1 are empty. White castles, `e1g1`.

| Piece | Before set | After set | Lost |
| --- | --- | --- | --- |
| King, e1 to g1 | d1, d2, e2, f1, f2 | f1, f2, g2, h1, h2 | d1, d2, e2 |
| Rook, h1 to f1 | e1, f1, g1, h2 | d1, e1, f2, g1 | f1, h2 |

- `lost`: `d1`, `d2`, `e2`, `f1`, `h2`
- `controlled`: `d1`, `e1`, `f1`, `f2`, `g1`, `g2`, `h1`, `h2`

The squares `f1` and `h2` appear in both answers: one piece lost them and the other controls them.

All three examples, and the rook example under Mode 2, belong in the golden tests.

## Appendix C: Database schema

The MVP has four content tables and nothing about users. Every column is not-null unless marked nullable, and every table also has the standard created and updated timestamps.

**`masters`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `slug` | text | Unique; lowercase letters only, used in URLs, for example `capablanca` |
| `name` | text | Display name |
| `sort_order` | smallint | Unique; display order: Morphy, Capablanca, Alekhine, Botvinnik, Tal, Fischer, Spassky |

The seven rows are created by a seeder kept in the repository.

**`master_games`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `master_id` | bigint | The winner; foreign key to `masters`, deletion restricted |
| `fingerprint` | char(64) | Unique; see Appendix D |
| `master_color` | text | `white` or `black` |
| `opponent_name` | text | Written as first name then last name |
| `year` | smallint | Nullable; between 1800 and 2100 |
| `event` | text | Nullable |
| `ply_count` | smallint | At least 1 |
| `guess_count` | smallint | The winner's number of moves: half of `ply_count`, rounded up for White and down for Black |
| `moves` | jsonb | Array with one entry per ply, in order; its length equals `ply_count` |

A `moves` entry:

```json
{ "uci": "e2e4", "san": "e4" }
```

**`practice_games`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `fingerprint` | char(64) | Unique; see Appendix D |
| `white_rating` | smallint | Between 0 and 4000 |
| `black_rating` | smallint | Between 0 and 4000 |
| `time_control` | text | As given by Lichess, for example `600+0` |
| `ply_count` | smallint | At least 1 |
| `answers_version` | smallint | The version of the calculation in Appendix B that produced the answers; starts at 1 |
| `moves` | jsonb | Array with one entry per ply, in order; its length equals `ply_count` |

A `moves` entry:

```json
{
  "uci": "g1f3",
  "san": "Nf3",
  "piece": "knight",
  "lost": ["e2", "f3", "h3"],
  "controlled": ["d2", "d4", "e1", "e5", "g1", "g5", "h2", "h4"],
  "hanging": ["e5"]
}
```

No usernames and no Lichess game ID are stored, since the ID links back to the players.

**`puzzles`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `lichess_id` | text | Unique; Lichess's own puzzle ID |
| `fen` | text | The position before the opponent's setup move, exactly as Lichess gives it |
| `setup_move` | text | The opponent's move that plays first |
| `first_move` | text | The solver's first move |
| `reply_move` | text | Nullable; the opponent's reply in a two-move puzzle |
| `second_move` | text | Nullable; the solver's second move |
| `piece` | text | The category; one of the six piece types |
| `ends_in_mate` | boolean | True when the solver's last move is checkmate |
| `rating` | smallint | Lichess puzzle rating |
| `popularity` | smallint | Between -100 and 100 |
| `plays` | integer | Number of times played on Lichess |

**Constraints and indexes**

- Check constraints enforce every fixed set and range above: the two colours, the six piece types, the rating, year and popularity ranges, and the slug format.
- `guess_count` is between 1 and `ply_count`.
- Each `moves` column is a JSON array whose length equals `ply_count`.
- On `puzzles`, `reply_move` and `second_move` are both null or both present.
- Indexes: `master_games (master_id, year)` and `puzzles (piece)`.
- Search on opponent and event uses a case-insensitive match. No special index is needed at this size.
- List queries never select the `moves` column.
- The contents of each `moves` entry are validated by the import, not by the database.

## Appendix D: Fingerprints and re-imports

A fingerprint is how an import recognizes an item it has already loaded, which is what keeps IDs stable.

| Item | Fingerprint |
| --- | --- |
| Master game | SHA-256, as lowercase hex, of the master's slug, the master's colour and the moves, joined as shown below the table |
| Practice game | SHA-256, as lowercase hex, of the moves in the form `e2e4 e7e5 g1f3` |
| Puzzle | The Lichess puzzle ID, used as it is |

Moves are in coordinate form, joined by single spaces. For a master game, the slug, the colour and the moves are joined by vertical bars, so the text that gets hashed looks like this:

```text
capablanca|white|e2e4 e7e5 g1f3
```

**Why the master fingerprint leaves out opponent, year and event**

The same game appears in different collections with different name spellings and dates, and those are the duplicates the import must catch. The fingerprint therefore uses only what does not vary between sources. Two games by the same master, with the same colour and identical moves, count as one game.

**What an import does**

| Case | Result |
| --- | --- |
| Fingerprint not in the database | The item is inserted and gets a new ID |
| Fingerprint already in the database | The item is skipped |
| Fingerprint already in the database, with the update option | Its details are rewritten in place and its ID is unchanged |

- For practice games, the update option also rewrites the `moves` list with freshly calculated answers and sets `answers_version`. This is how a fix to the calculation reaches games already loaded.
- An import never deletes rows, and no command empties a content table.
- Removing one bad item is a separate command that takes its ID.
- Master games whose moves are the beginning of another game by the same master and colour are listed in the report as possible duplicates. They are not removed automatically.

## Appendix E: Import pipeline

Each import runs in two stages, so all chess logic lives in TypeScript and the large source files never need to reach the server.

| Stage | Written in | Does | Runs on |
| --- | --- | --- | --- |
| 1. Extract | TypeScript, run with Node | Reads the source file, filters it, replays every game with chess.js, calculates answers, and writes an intermediate file | Any machine |
| 2. Load | A Laravel command | Reads the intermediate file, validates its shape, and inserts, skips or updates by fingerprint | The server |

The load stage contains no chess logic.

**Commands**

| Mode | Extract | Load |
| --- | --- | --- |
| Guess the move | `npm run extract:masters` | `php artisan import:master-games` |
| Square control | `npm run extract:practice` | `php artisan import:practice-games` |
| Tactics | `npm run extract:puzzles` | `php artisan import:puzzles` |

- Every extract command takes `--input` and `--out`.
- Every load command takes the intermediate file, plus `--dry-run` and `--update`.
- Both stages print a report: how many items were accepted and how many were skipped, counted by reason.
- A load is all or nothing. If any line is invalid, nothing is written and the report names the line.

**Intermediate file**

- JSON Lines: UTF-8 text with one JSON object per line.
- The first line is a header naming the kind of content, the format number, and the options used: `{"kind": "master_games", "format": 1, "options": {}}`.
- Every following line is one item, with the same fields as its table in Appendix C except `id` and the timestamps. A master game carries `master_slug` in place of `master_id`.
- A load command refuses a file whose kind does not match, or whose format number it does not know.

**Options**

The defaults marked as placeholders stand in for the open decisions. They are options so that the values can change without code changes.

| Command | Option | Meaning | Default |
| --- | --- | --- | --- |
| `extract:masters` | `--min-plies` | Shortest game kept | 40, placeholder |
| `extract:masters` | `--exclude-events` | Words in the event or site that exclude a game | simul, blindfold, odds, exhibition, consultation |
| `extract:practice` | `--max-rating` | Rating limit | 1000 |
| `extract:practice` | `--both-players` | Whether both players must be under the limit | Yes, placeholder |
| `extract:practice` | `--exclude-speeds` | Speeds to skip, read from the game's Event tag | bullet and ultrabullet, placeholder |
| `extract:practice` | `--min-plies` | Shortest game kept | 30, placeholder |
| `extract:practice` | `--limit` | Stop after this many accepted games | 300, placeholder |
| `extract:puzzles` | `--max-rating` | Highest puzzle rating kept | 1500, placeholder |
| `extract:puzzles` | `--min-popularity` | Lowest popularity kept | 80, placeholder |
| `extract:puzzles` | `--min-plays` | Fewest plays kept | 500, placeholder |
| `extract:puzzles` | `--per-category` | Most puzzles kept per piece | 2000, placeholder |

**Master games: extract rules**

- A configuration file lists each master's slug with the name spellings found in the sources.
- The result must be a win, and the winner's name must match one of the seven masters.
- Winners that match no master are counted by name in the report, so a missing spelling is noticed.
- A game with a custom starting position, shown by a `SetUp` or `FEN` tag, is rejected.
- Comments, side variations and annotation symbols are removed.
- `year` is the first four digits of the date when they are digits, otherwise null.
- `opponent_name` is rewritten from last name, first name to first name then last name.

**Practice games: extract rules**

- The source is a monthly file of standard rated games. It is read as a stream while still compressed, so it is never unpacked in full.
- Ratings come from the `WhiteElo` and `BlackElo` tags. A game missing either is skipped.
- Games that ended by abandonment or a rules infraction are skipped.
- Player names, the game link, and clock and evaluation comments are dropped.
- Each move's answers are calculated as in Appendix B.

**Puzzles: extract rules**

- The Lichess file has the columns `PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, GameUrl, OpeningTags, DailyDate`. Columns are read by name, not by position.
- The first move in `Moves` is the opponent's setup move. The rest alternate, starting with the solver.
- Only puzzles with exactly two or four moves are kept, which is one or two solver moves.
- Same-piece rule for four-move puzzles: the solver's second move must start on the square where the solver's first move ended.
- `piece` is the type of the piece making the solver's first move, before any promotion.
- `ends_in_mate` is found by replaying the puzzle.
- When a category has more puzzles than `--per-category`, the most popular are kept, then the most played, then by puzzle ID, so the choice is the same on every run.
- The game link and theme labels are not stored.

## Appendix F: Pages and data endpoints

Inertia serves the pages, and a small set of read-only endpoints serves game and puzzle data. The browser decides which item to fetch; the server only serves items by ID.

**Pages**

| Path | Page |
| --- | --- |
| `/` | Home, with the three modes |
| `/guess` | The seven masters |
| `/guess/{master}` | Game list for one master, by slug |
| `/guess/{master}/random` | Redirects to a random game by that master |
| `/guess/{master}/{game}` | Play a master game |
| `/squares` | Square control landing page: the three phase percentages and a Start or Resume button |
| `/squares/play` | The square-control exercise |
| `/tactics` | The piece categories |
| `/tactics/{piece}` | Play tactics; `piece` is one of the six piece types or `all` |
| `/progress`, `/settings`, `/credits`, `/privacy` | As named |
| `/sitemap.xml` | Lists the master pages and master game pages |
| `/about` | About |

- The game list is sorted by year and shows 30 games per page.
- Its query parameters are `q`, `color`, `year_from`, `year_to` and `page`. The search box `q` matches opponent and event, which is how those two are filtered.
- The list receives each game's details as page data, never its moves.
- Master and master game pages are rendered on the server with a readable title and description, such as "Guess the move: Capablanca vs. Marshall, New York 1918".

**Data endpoints**

| Endpoint | Returns | Cached for |
| --- | --- | --- |
| `GET /api/master-games/{id}` | One master game with its details and moves | 1 day |
| `GET /api/practice-games/ids` | The IDs of all practice games | 1 hour |
| `GET /api/practice-games/{id}` | One practice game with its moves and answers | 1 day |
| `GET /api/puzzles/ids?piece=knight` | Every puzzle in one category, as pairs of ID and rating | 1 hour |
| `GET /api/puzzles?ids=1,2,3` | Up to 20 puzzles by ID | 1 day |

A master game response:

```json
{
  "id": 412,
  "master": { "slug": "capablanca", "name": "José Raúl Capablanca" },
  "master_color": "white",
  "opponent_name": "Frank Marshall",
  "year": 1918,
  "event": "New York",
  "ply_count": 71,
  "guess_count": 36,
  "moves": [{ "uci": "e2e4", "san": "e4" }]
}
```

A puzzle ID list response:

```json
{ "piece": "knight", "items": [[101, 870], [102, 1240]] }
```

**How the browser chooses**

- Square control: the browser fetches the ID list, picks at random an ID it has not played, and fetches that game.
- Tactics: the browser fetches the ID list for the category, removes the puzzles it has seen, picks at random, and fetches the next few in one request. For the all pieces option it combines the six lists.
- This makes "no repeats until the category runs out" exact, and every response the same for every visitor.
- Ratings are in the ID list so that an easiest-first order can be added later in the browser alone.

**Rules for the endpoints**

- They are stateless: no session and no cookies. A response that sets a cookie is not cached by Cloudflare.
- Each response carries a public cache header with the time shown above, and a Cloudflare cache rule covers `/api/*`.
- After an import that uses the update option, the Cloudflare cache is purged. Newly added items appear within an hour without a purge.
- An unknown ID returns 404. An invalid parameter returns 422. Both have a JSON body with a message.
- Requests are limited to 120 per minute per visitor, a placeholder value.
- Laravel is configured to trust Cloudflare's forwarding headers. Without that, every visitor appears to come from Cloudflare's address and they all share one limit.
- Each response shape is a PHP data class with a generated TypeScript type.

## Appendix G: Browser storage

All user data lives in one IndexedDB database in the browser, opened through the `idb` library. The database is named `chess-training` until the site has a name, and starts at version 1.

**Stores**

| Store | Key | Holds |
| --- | --- | --- |
| `meta` | Fixed key `meta` | The schema version and the date of first use |
| `settings` | Fixed key `settings` | The user's settings |
| `masterGames` | `gameId` | One record per master game started: the attempt in progress and the last finished result |
| `squareSession` | Fixed key `current` | Where the user is in square control |
| `squareSeen` | `gameId` | Practice games finished or abandoned |
| `squareTallies` | Fixed key `tallies` | Attempts and correct answers per phase and per piece |
| `puzzlesSeen` | `puzzleId` | Puzzles attempted |
| `tacticsTallies` | Fixed key `tallies` | Attempts and solves per piece |

**Record shapes**

```ts
type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
type Phase = 'lost' | 'controlled' | 'hanging'
type Tally = { attempts: number; correct: number }
type Guess = { uci: string; correct: boolean }

type Settings = {
  appearance: 'light' | 'dark' | 'system' // default 'system'
  boardTheme: string
  pieceSet: string
  sound: boolean
  moveInput: 'tap' | 'drag' | 'both'
  opponentDelaySeconds: number // 1 to 10, default 3
  markingPalette: string
}

type MasterGameRecord = {
  gameId: number
  masterSlug: string
  finished: { correct: number; total: number; guesses: Guess[]; finishedAt: string } | null
  current: { guesses: Guess[]; startedAt: string; updatedAt: string } | null
}

type SquareSession = { gameId: number; ply: number; phase: Phase; updatedAt: string }

type SquareSeen = { gameId: number; status: 'finished' | 'abandoned'; at: string }

type SquareTallies = Record<Phase, Record<PieceType, Tally>>

type PuzzleSeen = { puzzleId: number; piece: PieceType; solved: boolean; at: string }

type TacticsTallies = Record<PieceType, Tally>
```

**Guess the move**

- `guesses` has one entry per guessed move, in order. The position to resume at follows from its length.
- `current` is the attempt in progress, and `finished` is the last completed attempt.
- A game shows the in-progress marker while `current` is not null.
- Starting a replay fills `current` and leaves `finished` alone. When the replay ends, it replaces `finished` and `current` is cleared. The list shows the earlier score until then.
- The share summary and the end-of-game replay are built from `finished.guesses`.

**Square control**

- `ply` is the move being worked on, and `phase` is the next phase to submit.
- A phase is added to the tallies at the moment it is submitted, under the type of piece that moved. Resuming continues at the exact phase, so nothing is counted twice.
- Marks that were not submitted are not saved.
- The percentage shown for a phase is the total across the six piece types.
- Pressing next game before the end records the game as abandoned.
- When every practice game is in `squareSeen`, that store is cleared.

**Tactics**

- A puzzle is recorded at the first attempt, and `solved` is the result of that attempt.
- When a category has no unseen puzzles left, that piece's records in `puzzlesSeen` are deleted. The tallies are kept.
- For the all pieces option, the pool is every unseen puzzle across the six categories. When it is empty, all records in `puzzlesSeen` are deleted.

**General rules**

- All reading and writing goes through one storage module. Pages never use IndexedDB directly.
- Dates are stored as ISO 8601 text in UTC.
- The reset progress button clears every store except `settings` and `meta`.
- On first use, the site asks the browser for persistent storage where that is supported.
- If storage is unavailable, as in some private browsing modes, the site still works for the visit and shows a notice that progress will not be saved.
- A change to the structure raises the database version and runs an upgrade step. Stores are never deleted to make a change.

## Appendix H: Share summary, code layout and agent rules

These are the remaining details an agent would otherwise have to guess.

**Share summary**

```text
Chess training · Guess the move
José Raúl Capablanca vs. Frank Marshall, 1918
23/36
(squares, ten per line)
https://example.org/guess/capablanca/412
```

- Line 1 is the site name and the mode. Line 2 is White's name, then Black's name, then the year if known. Line 3 is the score.
- The squares are one emoji per guessed move, in order: a green square for a correct guess and a white square for a wrong one, ten per line.
- The last line is the link to the game.
- The summary never contains moves.
- It is sent through the phone's share sheet where available. Otherwise it is copied to the clipboard, with a confirmation message.

**Code layout**

Suggested, to be adjusted to what the starter kit creates.

| Path | Holds |
| --- | --- |
| `app/` | Laravel code: models, data classes, endpoint controllers and the load commands |
| `resources/js/pages/` | The Vue pages |
| `resources/js/components/board/` | The Chessground wrapper and the square-marking layer |
| `resources/js/chess/` | Shared TypeScript chess code: conventions, the calculation in Appendix B, move comparison, and the golden tests |
| `resources/js/storage/` | The browser storage module |
| `tools/import/` | The extract scripts, which use the shared chess code |
| `docs/requirements.md` | This document |
| `AGENTS.md` | The agent rules below |

**Agent rules**

These go into the agent instruction file.

- Read `docs/requirements.md` before starting.
- Work on one build step at a time, and stop when its finish line is met.
- When the document is silent or contradicts itself, stop and ask. Do not guess.
- Run the check command before finishing. Never finish with it failing.
- Do not change the check configuration, the CI workflow or the licence file without approval, and do not add comments that silence a check.
- Design and review every screen at phone width first, about 390 pixels.
- Do not add a dependency without stating its licence. It must be compatible with GPL-3.0.
- Never commit secrets, imported data or database dumps.
- Do not add tests beyond the fixed set unless asked.
- Do not add features that are not in the document. There are no accounts and no login.
- Keep all chess logic in the shared TypeScript chess code. None goes in PHP.
- Never write code that deletes or reloads imported content.

**Known pitfalls**

- The route `/guess/{master}/random` must be registered before `/guess/{master}/{game}`, and `{game}` must accept digits only.
- Chessground can report castling as the king moving onto the rook. Normalize it before comparing.
- The data endpoints must not start a session, or Cloudflare will not cache them.
- The control calculation must not use the rules library's own attack helpers.
- Pawn pushes, castling and promotion are where the control rules are easiest to get wrong. Each has a golden test.
