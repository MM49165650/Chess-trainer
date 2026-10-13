# Chess training site: product requirements

Last updated: 13 October 2026

A free, open source, mobile-first chess training site with four modes: guess the move against eleven masters, a square-control drill on beginner games, spotting hanging pieces in the same games, and short tactics that win material, grouped by piece. The MVP has no accounts, and all progress is kept in the browser.

## MVP scope

The MVP is four training modes served from a read-only library, with nothing to log in to. The site is free, not intended to make money beyond possible donations, and its code is public.

**In the MVP**

- Guess the move, with games from eleven masters
- Square control, on games by players rated under 1200
- Spot the hanging piece, on the same games
- Tactics by piece, two moves long, each winning material by a capture
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
- Showing puzzle theme labels (fork, pin and so on)
- Any anti-cheating measure

**Principles**

- Answers are checked in the browser. Cheating only affects the cheater, so nothing is hidden on the server.
- All chess logic runs once, at import. The server stores positions and expected answers and never calculates chess rules at request time.
- Scoring is exact match everywhere.

## Mode 1: Guess the move

The user picks a master game and guesses every move the winner played, starting from move 1.

**Masters**

Eleven masters, shown in this order: Morphy, Lasker, Rubinstein, Capablanca, Alekhine, Keres, Smyslov, Botvinnik, Tal, Spassky and Fischer. They are not grouped by era. Lasker, Rubinstein, Keres and Smyslov were added on 12 October 2026.

- Each game is filed under its winner. Capablanca beating Alekhine appears under Capablanca only.

**Play**

- The user guesses the winner's moves. The opponent's moves play automatically after a delay the user sets, from 1 to 5 seconds.
- Guessing starts at move 1. If the winner had Black, White's first move plays automatically.
- One attempt per move. After the guess, right or wrong, the actual move is played and the game continues.
- Only legal moves can be made on the board. A promotion shows a piece picker, and the guess includes the promotion piece.
- Feedback on a wrong guess is the user's move shown against the master's move.
- After a wrong guess, the board moves from the user's move to the master's move more slowly than a normal move, so the correction can be followed: about 450 milliseconds, against 200 for other moves. Both are kept as named values so they are easy to tune. With reduced motion turned on in the device settings, there is no animation.
- Moves in feedback are described in words: "took on e3" for a capture, "castled", otherwise "played Nf3". A correct guess is confirmed in the accent colour. The result of the last guess stays on screen until the user's next guess.
- If a game's moves fail to load, the page says so and offers Try again. A game that does not exist says so with no retry.
- The board is oriented to the winner's side, and the last move played is highlighted.
- Progress is saved after every move, so closing the tab and returning resumes at the same position.
- Several games can be in progress at once, each resumable.
- The user can step back and forward through the moves already played, to look at earlier positions, both during the game and after it ends. Back and forward buttons sit in the bottom bar, and the left and right arrow keys do the same on a keyboard. Nothing past the current position can be shown, so viewing never reveals a move still to be guessed.
- While an earlier position is shown, the board cannot be moved, the game pauses, and the opponent's pending reply waits; a clear way back to the current position is shown. Returning to it resumes the game where it paused. Viewing earlier positions changes nothing that is saved.
- A finished game can be replayed. The new score replaces the old one.

**Scoring**

- The score is correct guesses out of total guesses, for example 23/34.
- A move is correct only if it matches the move played. Moves are compared by from-square, to-square and promotion piece, not by written notation.
- The progress page shows the user's accuracy for each master: correct guesses out of all guesses, as a percentage, counted over finished games only and using each game's latest finished result. Masters are listed from highest to lowest accuracy, each with its number of games and moves, for example "Capablanca 72% · 4 games, 131 moves". Masters with no finished game are not listed. Nothing new is stored; it is worked out from the saved game records.

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

- The winner must be one of the masters.
- Draws are excluded.
- Odds games, which start from a non-standard position, are excluded. Where the source does not label one, it is left out by the exclusion list described in Appendix E.
- Simultaneous and blindfold games are excluded where the data labels them. PGN Mentor marks simultaneous games with the word "sim". One-on-one exhibition games against other masters are kept.
- Blitz and rapid games are excluded where the data labels them. Training, radio, telex, television, team and correspondence games are kept.
- The minimum length is two plies. This leaves out games forfeited after one move.
- Duplicate games are removed.
- Player names are normalized so each master has one spelling.
- Annotations and commentary are stripped; only moves and basic details are kept.
- Every game is replayed, and any game with an illegal move is rejected.

## Mode 2: Square control

The user watches a beginner game one move at a time and, after every move, marks what changed on the board in two phases.

Until 13 October 2026 this mode had a third phase, hanging pieces. On that day, before build step 27, it became a mode of its own: Mode 4, spot the hanging piece. The two modes share the games, the stored answers and the marking screen, and each keeps its own progress.

**Games**

- Games come from the Lichess open database: rated 10-minute rapid games with no increment, with both players rated under 1200. Games with a bot player are left out. Decided on 13 October 2026.
- 500 games are loaded, between 30 and 120 plies long, chosen for a mix of openings and game lengths. Appendix E has the exact rule.
- Usernames are removed at import.
- The user goes through the whole game move by move, starting at move 1. These are not isolated puzzles.
- Moves are shown, not guessed. Every move by either side is an exercise.

**The two phases**

Each phase is marked and scored separately, in this order.

| Phase | The user marks | Rule |
| --- | --- | --- |
| 1. Squares lost | Squares the moved piece no longer controls | Controlled before the move and not after |
| 2. Squares controlled | Squares the moved piece now controls | Every square it controls after the move, including ones it already controlled |

A castling move moves two pieces, so it has four phases, in this order: the king's squares lost, the king's squares controlled, the rook's squares lost, the rook's squares controlled. Decided on 13 October 2026.

**Definitions**

These rules are the specification for the import code and its tests. The two hanging rows are what Mode 4 asks about; the import works out all three answer sets for every move.

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
- Castling is marked as two pieces, separately: first the king's lost and controlled squares, then the rook's. Each prompt names the piece it is about. A square is never in both phases of one piece, because a piece's lost squares are the ones it no longer controls. A square can still be lost by one piece and controlled by the other, such as f1 when White castles kingside.
- Promotion: the before set is the pawn's and the after set is the new piece's. A square the pawn controlled is lost only if the new piece does not control it. A pawn that promotes to a queen by a push loses nothing, because the queen still controls both of the pawn's squares.
- An empty submission is valid. A pawn that promotes to a queen by a push has no squares lost.

**Worked example**

A rook moves from a1 to a4. The only other pieces are the white king on g2 and the black king on g7, which affect no answer.

- Before: it controls a2 to a8 and b1 to h1.
- Phase 1 answer: b1 to h1, plus a4.
- Phase 2 answer: a1 to a3, a5 to a8, and b4 to h4.

**Scoring and feedback**

- Each phase has its own score: 1 if it is exactly right, 0 otherwise. Missed squares and wrongly marked squares both fail the phase. Each phase is scored exactly once, when it ends.
- The user sees two running percentages, squares lost and squares controlled, to show which skill is weaker.
- Tallies are also kept by the type of piece that moved. On a castling move the king's two phases count towards the king and the rook's two towards the rook.
- A phase checks itself as it is marked, and there is no Submit in this mode. Decided on 13 October 2026, after the split into two modes; spot the hanging piece keeps Submit.
- Exactly right: when the marked squares exactly match the answer, with at least one square marked, the phase ends and counts as correct. It shows the tick and "Exactly right" for about 0.6 seconds, a named value, and then moves on by itself: to the next phase or, after the last phase of a move, to the next move, which plays.
- Wrong square: marking a square that is not in the answer shows it as wrong at once, drawn as a wrong square is in the feedback, and the phase counts as failed. The user can unmark it and keep going. If they then complete the set, it moves on as above, with "Exactly right", but the phase still counts as failed, and its square in the phase indicator shows a cross.
- An empty answer is only confirmed by pressing the main button, which reads "Nothing" while no square is marked. A "Nothing" that is right moves on by itself in the same way.
- Pressing the main button ends the phase, whatever is marked. The feedback then appears: missed squares are highlighted, and wrongly marked squares are shown in a second colour. The phase counts as failed unless the selection was exactly right and no wrong square was marked on the way. If anything is missed or wrong, it stops on the feedback and the button continues.
- Rewind during the pause cancels the move on. The feedback then stays, and the button continues. Pressing the button during the pause moves on at once.
- The end of a game never moves on by itself: after the last phase of the last move it stops on "Next game", even when the phase was exactly right.

**Sessions**

- Sessions are open-ended. The user goes for as long as they like, and returning resumes at the same move.
- A next game button serves a random game. There is no browsing. The mode opens on a landing page at /squares that shows the two phase percentages and a Start or Resume button. The exercise itself runs at /squares/play.
- The session, the seen games and the scores are this mode's own. A game played in spot the hanging piece is not used up here.
- The board is shown with White at the bottom.
- A rewind button shows the position before the move. The move's squares are not highlighted in this mode. Phase 1 depends on that earlier position, and a user resuming a session did not just watch the move.

**The marking screen**

Settled in build step 26, and shared with spot the hanging piece since 13 October 2026. What differs there is listed under Mode 4.

- The move plays on the board from the position before it, with no square highlighted, and phase 1 opens at once. It plays more slowly than moves elsewhere, about 450 milliseconds, so that it can be followed. Before the first move of a game the starting position is shown for about 0.8 seconds. Both are kept as named values. With reduced motion there is no animation.
- A line above the question names the move in words, with the move number as a game score gives it: "Move 2 · White played Nf3", "Black took on e5", "White took on d6 en passant", "White castled kingside", "White promoted to a queen on e8". The written move keeps its own case inside the uppercase label, because in capitals `bxc4` and `Bxc4` would read the same.
- The questions are "Which squares does the knight no longer control?" and "Which squares does the knight control now?". After a promotion the second question names the new piece: "Which squares does the new queen control?".
- The phase indicator has two tabs. On an ordinary move they are Lost and Controls. On a castling move they are King and Rook: each shows two small squares, the first in the lost colour and the second in the controls colour, and the question names the piece. The current tab is underlined in the colour of the phase being marked. Each phase's square turns into a tick when the phase scored and a cross when it failed.
- Rewind is a toggle, not a button to hold. While it is on, the button shows as pressed, the board shows the position before the move, and the line above the question starts "Before move 2". Squares can still be marked while the earlier position is shown, in every phase, and the marks are kept when it is switched off. Rewind switches off when a phase ends, so the feedback is first seen on the position after the move, and on every new move. It can be switched on again while the feedback is showing.
- While marking, a marked square that is not in the answer is drawn at once as a wrong square, in the feedback's red, and tapping it again unmarks it. Nothing else on the screen changes: the question stays, and the legend stays empty until the phase ends.
- The main button reads "Nothing" while no square is marked, and "Show me" once at least one is. Either press ends the phase.
- After a phase ends, the line above reads "Move 2 · Controls · Not quite" in the wrong colour, or "… · Exactly right" in the accent colour, and the heading says how it came out: "Three squares missed, one too many.", "All eight squares.", "Both squares.", "The only square." or "Nothing to mark, and nothing marked.". On a castling move the line names the piece, as in "Move 5 · Rook · Lost · Not quite".
- The main button then names what comes next: "Next: squares controlled" and "Next move". On a castling move it reads, in order, "Next: king's squares controlled", "Next: rook's squares lost", "Next: rook's squares controlled" and "Next move". After the last phase of a game's last move the line above starts "End of the game" and the button reads "Next game". There is no end-of-game screen.
- Until sessions are built in step 27, the screen opens a game picked at random from the ID list, from its first move, and "Next game" at the end picks another. The "Next game" button in the header comes with step 27, the percentages under the board with step 28, and the report a problem link with step 33.

## Mode 3: Tactics by piece

The user solves short tactics grouped by the piece that delivers them. The mode is about winning material by capturing with a given piece. This was decided on 12 October 2026, after the full Lichess file was counted.

**Categories**

- Six categories: pawn, knight, bishop, rook, queen, king.
- An all pieces option draws puzzles from every category.
- The category page at `/tactics` lists All pieces first, then the six pieces in the order above. Each row shows the name, the number of puzzles in it, and the user's tally as solved out of attempted, for example "14 / 20". The tally is hidden until there is an attempt. The All pieces row shows the sum of the six. Settled in build step 22.
- The king category covers tactics such as capturing an undefended piece with the king.
- A puzzle is filed under the piece that makes the solving moves.

**Puzzles**

- Puzzles come from the Lichess puzzle database.
- A puzzle is two solver moves long, and the same piece makes both moves. One-move puzzles are left out: nearly all of them are checkmates.
- The solver's last move is a capture, of a piece or a pawn. En passant counts.
- The solver's last move is never checkmate. Puzzles that end in checkmate are left out.
- A pawn that promotes and then moves again counts as the same piece, and the puzzle is filed under pawn.
- Castling, if it appears, counts as a king move.
- Only well-rated, widely played puzzles are imported, using the popularity figures in the data: a rating of at most 1500, a popularity of at least 80, at least 500 plays, and the 2,000 most popular per piece.

**Play**

- The opponent's previous move plays first, so the user sees what just happened.
- The board is oriented to the solver's side, only legal moves can be made, and the last move played is highlighted.
- The opponent's reply plays automatically after a correct first move.
- A wrong move fails the puzzle. The user can then retry until they find the answer.
- After a wrong move the piece goes back, and the retry starts from the position where the wrong move was made, not from the start of the puzzle. A wrong second move after a correct first move also fails the puzzle.
- A show solution button is available after a failure. It plays only the next correct move, the one the user missed, and does not play the rest. The puzzle stays failed.
- Once the solution has been shown, or the puzzle has been solved, the back and forward buttons in the bottom bar step through the puzzle, back to the position before the opponent's first move and forward to the final capture. The left and right arrow keys do the same, as in guess the move. No text names the capture; the board shows it.
- The opponent's moves play after fixed delays: about 0.8 seconds before the first one and about 0.5 seconds before the reply. Both are kept as named values so they are easy to tune. The 1 to 5 second setting applies to guess the move only.
- A Next puzzle button appears once a puzzle is over.
- A Redo button appears once a puzzle is over, whether it was solved or failed, and with or without the solution shown. It restarts the same puzzle from before the opponent's first move. It does not change the result: the first attempt still decides. It is a secondary button beside the prompt, so Next puzzle stays the main action in the bottom bar.
- The six points above were settled in build step 21.
- Puzzles are served easiest first within a category, by their Lichess rating. Puzzles with the same rating are served by puzzle ID, lowest first.
- The all pieces option is one list across the six pieces, by rating and then by puzzle ID. Pieces are not taken in turn, so the mix follows the ratings: the easiest puzzles are mostly rook and king puzzles, and it evens out later.
- In all pieces the prompt does not name the piece: it reads "Win material in two moves." In a piece's own category it names it, as in "Win material with the knight."
- A puzzle counts as seen once its result is decided: at the first wrong move, or at the final capture when there was none. A puzzle that was shown and left before that is not seen, and is served again.
- A puzzle the user has seen is not served again until the category runs out. The seen list for that category then resets.
- Seen records are shared: there is one per puzzle, whichever category it was played in. A puzzle seen in the knight category is skipped in all pieces, and the other way round.
- When one piece runs out, only that piece's seen records are cleared. When all pieces runs out, which is when every puzzle has been seen, all six are cleared. In all pieces, a piece that has run out is skipped until all of them have.
- When a category runs out, the screen says "You have been through every knight puzzle. They start again from the easiest." with a Continue button. The seen records are cleared when Continue is pressed.
- The eight points above were settled in build step 22.
- An Auto next toggle sits in the play screen's header, beside the title, so the bottom bar is not crowded. It is off by default. When it is on, a solved puzzle moves to the next one by itself after a pause of about 0.5 seconds, so the final capture is seen. The pause is kept as a named value.
- Only a puzzle solved without a wrong move moves on by itself. A failed puzzle never does, whether the user retried to the end or the solution was shown, and neither does a Redo that ends with a wrong move or the solution.
- Pressing Redo, either arrow or the toggle itself during the pause cancels the move. Next puzzle moves on at once.
- The choice is one of the user's settings. It is remembered in the browser and applies in every category, including all pieces. Added in build step 22.

**Scoring**

- Each puzzle is solved or failed, decided by the first attempt. A correct answer on a retry still leaves the puzzle failed.
- The user sees running tallies per piece category. A result in all pieces counts towards the tally of the puzzle's own piece.
- There is no rating for the user.

## Mode 4: Spot the hanging piece

The user watches a beginner game one move at a time and, after every move, marks every piece and pawn that is hanging. Decided on 13 October 2026, when the hanging phase was taken out of square control. It is numbered after tactics so that earlier references to Mode 3 still hold; the order of the modes on the home and progress pages is decided in build step 33.

**Games**

- The games are the 500 practice games of square control, with the same stored answers. Nothing is imported again, and the mode has no import command of its own.
- The user goes through the whole game move by move, starting at move 1. Moves are shown, not guessed, and every move by either side is an exercise.

**The one phase**

- Each move has one phase: mark every hanging piece and pawn on the board, of both sides, judged after the move. A castling move has one phase as well.
- The rules for hanging are those of Mode 2's definitions and Appendix B: attacked by at least one enemy piece and defended by no friendly piece, with pins ignored and kings left out. The answer is the stored `hanging` set.
- A hanging piece is marked again on every move for as long as it stays hanging.
- The piece that just moved can itself be hanging.
- An empty submission is valid. Many positions have no hanging pieces.

**Scoring and feedback**

- The phase scores 1 if the selection is exactly right, and 0 otherwise. Missed pieces and wrongly marked squares both fail it.
- The user sees one running percentage.
- There is one tally for the mode. It is not split by piece: the answer is about the whole board, not about the piece that moved.
- This mode keeps Submit, and does not check a phase as it is marked the way square control does. Nothing moves on just because the marks match the answer, a wrongly marked square is not shown until the phase is submitted, and only a submitted phase is scored.
- Feedback appears after the phase is submitted: missed pieces are highlighted, and wrongly marked squares are shown in a second colour.
- A phase submitted exactly right plays the next move by itself after about 0.6 seconds, the named value square control uses, showing the tick and "Exactly right" first. If anything is missed or wrong, it stops on the feedback and the button continues. Rewind during the pause cancels the move on, pressing the button during the pause moves on at once, and the end of a game stops on "Next game".

**Sessions**

- Sessions are open-ended, and returning resumes at the same move.
- A next game button serves a random game. There is no browsing. The mode opens on a landing page at /hanging that shows the percentage and a Start or Resume button. The exercise itself runs at /hanging/play.
- The session, the seen games and the scores are this mode's own. A game played in square control is not used up here.

**The marking screen**

The screen is square control's, with these differences.

- The question is always "Which pieces are hanging, on either side?", so it always says that both sides count.
- The phase indicator has the one tab, Hanging, in the hanging colour. Its square turns into a tick or a cross as in square control.
- The main button reads "Submit · 6 marked" while marking, and "Submit · none marked" when nothing is marked. A marked square is drawn in the hanging colour whether or not it is in the answer.
- After the phase is submitted, the line above reads "Move 2 · Hanging · Not quite" or "… · Exactly right", and the heading says "pieces" where square control says "squares": "One piece missed.", "Both pieces.", "Nothing to mark, and nothing marked.".
- The main button then reads "Next move", or "Next game" after a game's last move.
- Rewind, the move in words, the legend and the board are the same. The board is shown with White at the bottom, and the move's squares are not highlighted.
- Until sessions are built in step 27, the screen opens a game picked at random from the ID list, as square control does.

## Site-wide requirements

Most users are on phones, so phone width is the primary design target for every screen.

**Mobile**

- The board spans the full screen width, with all controls below it within thumb reach.
- The four play screens fit a phone without scrolling. Where the screen is too short for a full-width board, the board shrinks just enough and stays centred, down to 280 pixels. Below that the page scrolls. The height that counts is the height on show at that moment, so the fit holds as the browser's address bar comes and goes: the smaller of the dynamic viewport height and the visual viewport's height. The fit is measured again whenever the rest of the screen changes height, in every state: the end of a game, looking back at a move, a failed puzzle with Show solution, and the feedback of the two marking modes.
- The visible browser area on most phones is much shorter than the 390 by 844 of the mockups. The standard test sizes are 360×640, 375×550, 390×660 and 412×780, and every play screen is checked at all four by the fit test. The design targets are 360×640 and 390×660: at those two the board is the full width of the screen and nothing scrolls.
- At the end of a guess-the-move game the three buttons stay on one line. On a phone they read "Share", "Review" and "Play again"; a larger screen has room for "Review from the start" and "Play it again".
- On a short phone screen, 800 pixels tall or less, the play screens tighten their spacing to give the board more room; a taller phone keeps the mockup spacing exactly. Tap targets stay 44 pixels.
    - All four: the header is 44 pixels tall with no space above or below its buttons, and the bottom bar has 6 pixels above its content and 8 below.
    - Guess the move: the two players share one row under the board, 26 pixels tall, with the master on the left and the opponent and its note on the right; both go by family name ("Morphy", not "Paul Morphy"), the master's own note and "Your guess" are left out, and a name that still does not fit is cut short. The prompt is at least 118 pixels tall, with 8 pixels above its text and 8 below: room for the label, a one-line heading and either a two-line note or one row of buttons. The end-of-game buttons have 12 pixels of padding at each side and sit straight under the heading. While an earlier position is on the board, the way back is a "Back" button in the bottom bar, in the reply delay's place, so the prompt keeps its height in every state. The progress ticks are 6 pixels tall and sit 6 pixels above the score.
    - Tactics: the prompt is at least 165 pixels tall, with 8 pixels above its text and 8 below: room for the label, a one-line heading, a two-line note and the Show solution or Redo button, which sits straight under the note.
    - Square control and spot the hanging piece: the phase tabs have 4 pixels above and 6 below, the question has 8 above and 6 below, and the legend is at least 30 pixels tall with 6 above.
- A fixed bar at the bottom holds the main action: the phase indicator and submit button in the two marking modes, and the equivalent controls in the other modes.
- Squares are tapped to mark them in square control and spot the hanging piece, with no zooming needed.
- Moves can be made by tapping a piece and then a square, or by dragging.
- Nothing depends on hovering, and the page does not scroll while a piece is dragged.
- Game lists are rows separated by hairlines, with filters in a slide-up panel.
- Data loads on demand, one game or puzzle batch at a time, to stay fast on mobile data.

**Larger screens**

- The layout is the same single column on every screen size. Nothing is rearranged for desktop.
- On a screen 640 pixels wide or more, the column is centred and the page background fills the rest. The board is never shown taller than the screen height minus 120 pixels, or wider than the screen width minus 32 pixels, so it always fits without scrolling; the user's chosen size is kept. The four play screens measure their limit instead, at every screen width: the board is never taller than the visible screen height minus everything else on the screen (the header, the prompt, the bottom bar, and the player rows, phase tabs or legend where there are any), so the whole screen fits without scrolling. The prompt area keeps one height at every width so the board does not change size as its text changes. Below the minimum board size the page scrolls: 320 pixels on larger screens, 280 on a phone. Settled in build step 13, and extended to phones after build step 26.
- The board can be resized by dragging a handle at its corner, between 320 and 720 pixels wide. The default is 560 pixels. Resizing changes the board only. Text and controls stay in a fixed column 560 pixels wide, and the board is centred on the same line, so it may be narrower or wider than the column.
- The chosen board size is saved with the other settings, as `boardSizePx`, when a resize ends: when the handle is let go, or an arrow key is pressed on it. It is not saved during a drag. It is read when a play screen opens, and one value serves all four modes, so the size stays the same from one puzzle or game to the next, across modes and across visits. On a phone there is no handle, and the board is the full width of the screen unless the screen is too short (see Mobile).

**Board**

- When a king is in check, its square shows the red highlight used on Lichess. Chessground provides this.
- The check highlight appears in all four modes, including the two marking modes, because it describes the position and does not reveal the move.

**Pages**

- Home, with the four modes
- A landing page per mode
- A progress page with the user's stats: guess-the-move accuracy by master, the two square-control percentages, the spot the hanging piece percentage, and tactics tallies by piece
- Settings
- About, at `/about`: what the site is, how the four modes work, and that it is free and open source
- Credits, with a link to the source code
- Privacy, a short page saying that progress is stored only in the browser and that Cloudflare analytics is used

**Settings**

- Appearance: light, dark, or match the device
- Board theme and piece set, taken from Lichess's collection, starting with three or four of each. The default board is Lichess's olive board and the default piece set is Lichess's Maestro
- Sound on or off. The sound source is undecided: Lichess's licence file lists most of its sounds as exceptions without a free licence, so they are not used unless that is cleared
- Move input: tap, drag, or both
- Opponent move delay in guess the move: 1 to 5 seconds in whole seconds, default 3. It is set with a slider that moves in whole seconds and shows the chosen value, such as "3 s", both on the play screen and in settings
- Marking colours for square control and spot the hanging piece, including at least one colour-blind-friendly palette

**Progress**

- All progress, history and settings are stored in the browser using IndexedDB, in a versioned format so they can be uploaded to an account later.
- Clearing browser data or switching devices loses progress. This is accepted for the MVP.
- Safari erases a site's stored data after seven days without a visit. Installing the site to the home screen avoids this, and the progress page explains how.

**Other**

- A reset progress button in settings, with a confirmation step.
- When a game or puzzle fails to load, the user sees a clear message and a retry button.
- Every exercise has a report a problem link that opens a GitHub issue pre-filled with the game or puzzle and the move number. The link is shown only once there is something to report, so it never gets in the way while playing: at the end of a master game and in its review, after a puzzle is solved or failed, and in square control and spot the hanging piece with the feedback for each move. Decided on 12 October 2026.
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
- The default board, olive, looks the same in light and dark mode for now. It is not dimmed or swapped in dark mode.
- The marking colours of square control and spot the hanging piece must be clear in both modes and on every board theme.
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
| Page background | `#EDE8DC` | `#1B1A17` |
| Raised surface | `#F4F0E6` | `#24231F` |
| Text | `#2A2824` | `#E9E4D8` |
| Muted text | `#6B665C` | `#A39D8F` |
| Hairline | `#D5CDBD` | `#35332D` |
| Accent | `#2E6A4F` | `#86BC9C` |
| Wrong guess | `#C98A6B` | `#A8644A` |
| Wrong guess, text | `#895E49` | `#E0A07E` |
| Board, light squares | `#ECE6D6` | `#B7B3A2` |
| Board, dark squares | `#8DA084` | `#65755E` |
| Last move, light squares | `#E3DC9A` | `#C9C27A` |
| Last move, dark squares | `#A9B36A` | `#8E9A52` |

The four board rows in this table describe the sage board drawn in the mockups, which is no longer the default, so they are not tokens. The olive board is the same in both modes, so everything drawn on the board uses the light-mode values in both modes: the last-move highlight, the marks and the feedback. These are separate "on the board" tokens. The "on the page" versions of the same colours, used for things like the phase indicator, still change with the mode. Outline buttons take their border from one more token, `#C3BBAB` in light mode and `#4A473F` in dark.

**Light mode brightness**

The light-mode backgrounds were softened on 11 October 2026 after the first values proved too bright on a real screen. The table above holds the chosen set, "a little softer". The other two are kept here so the brightness can be changed later by swapping these five values in the tokens file. Dark mode is unaffected.

| Token | Brighter (the mockups) | Chosen | Softer |
| --- | --- | --- | --- |
| Page background | `#F3EFE6` | `#EDE8DC` | `#E6E0D2` |
| Raised surface | `#FBF8F1` | `#F4F0E6` | `#EEE9DD` |
| Hairline | `#DDD6C7` | `#D5CDBD` | `#CEC5B3` |
| Muted text | `#6B665C` | `#6B665C` | `#68635A` |
| Outline-button border | `#C9C1B0` | `#C3BBAB` | `#BCB4A5` |

- Every text colour passes 4.5 to 1 in all three sets. The softer set is at the limit, with muted text at 4.53, so anything softer needs darker text colours as well.
- The phase and feedback colours are not yet used as text on the page. Lost fails 4.5 to 1 as text in every set, and Controls and Wrong fail in the softer set, so a screen that needs them as text uses darker text versions.

**Square-control marking**

| Phase colour | Light | Dark |
| --- | --- | --- |
| Lost | `#A66A0C` amber | `#E3A64A` amber |
| Controls | `#2B66A6` blue | `#8EC0EE` blue |
| Hanging | `#A03A78` magenta | `#D98BBB` pink |

- While marking, a marked square has a half-transparent fill in the phase colour and a solid 3 px border in a darker shade of it: the fill colour mixed with 50% black.
- After a phase is submitted, the three kinds of square differ in shape as well as colour, so they read without colour vision.

| Square | Drawn as |
| --- | --- |
| Correct | Blue fill with a solid border, the same in every phase of both marking modes |
| Missed | Dashed blue border, no fill |
| Wrong | Red fill `#BE3232` with a solid `#8A1C1C` border |

- A legend under the board counts correct, missed and wrong squares, and the main button moves to the next phase.
- The wrong colour has a text version for the "Not quite" line and the cross in the phase indicator: `#A32A2A` in light mode and `#E58A8A` in dark. Added in build step 26.
- On the board, the Light column of the phase table and the feedback colours above apply in both modes. The Dark column applies only to these colours where they appear on the page. This was settled in build step 9, after the pale dark-mode values proved unreadable on the olive board.
- The mockups are saved as images in the repository under `docs/design/`, because the building agent only sees what is in the repository.

**How it is enforced**

- Every colour, font size, spacing step and corner radius is a named design token, defined in one place. A mode is a different set of values for the same names.
- Components use tokens only. A lint rule rejects hard-coded colours.
- A small set of shared components is built before any screen: button, list row, bottom bar and slide-up panel. There is no card component.
- Every screen is reviewed on a phone in both modes before its build step is finished.

## Data and imports

All content is loaded by command-line import, one command per set of content. Square control and spot the hanging piece share one. Nothing can be added through the website. Appendix E has the exact commands, options and file format.

| Mode | Source | Stored per item |
| --- | --- | --- |
| Guess the move | Game files of the eleven masters | Game details, and the full move list stored on the game |
| Square control and spot the hanging piece | Lichess open database | Game details, and one list on the game holding each move with its three answer sets |
| Tactics by piece | Lichess puzzle database | The position, the solution moves, the piece category, the puzzle's rating, and Lichess's theme labels |

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
- Search engines: every public page's title and description are written into the page source by the server, so search engines and link previews can read them. Full server rendering of the app (Inertia's SSR, which needs a separate Node process) is not used; it can be switched on later if needed.
- Analytics: Cloudflare Web Analytics, which uses no cookies.
- Large Lichess files and the source of master games are decided when the imports are built.

**Guardrails**

- One check command runs everything below, in CI and before each commit, except the fit test, which takes about a minute and runs in CI only, as `composer check:fit`.
- Every play screen is checked at the four standard sizes by the fit test. A new play screen, or a new state that changes a screen's height, is added to it.
- PHP: strict types in every file, Larastan at a high level with no baseline, Pint, Rector, and Pest architecture tests.
- Laravel: strict models, destructive database commands blocked in production.
- Postgres: foreign keys, not-null, unique and check constraints throughout. Tests run against real Postgres.
- TypeScript: strict mode, with lint rules banning the escape hatches such as `any`.
- Boundary: TypeScript types and route helpers are generated from the PHP side, and the check fails if they are out of date.
- Agent instructions state that phone width is the primary target and that the check command must pass.
- Changes to the check configuration itself need human review.

**The check command, as built in step 2**

- The command is `composer check`, run inside Docker. It stops at the first failure.
- It runs, in order: Pint, Rector, Larastan at level max with no baseline, the Pest architecture tests, route helper generation, vue-tsc, ESLint, Stylelint, Prettier, Vitest, the licence check, and a scan for comments that silence a check.
- ESLint with typescript-eslint and eslint-plugin-vue is the linter, and Prettier is the formatter for TypeScript and Vue. The starter kit's own lint tool, vite-plus, was removed because it cannot read Vue templates.
- `any` and non-null assertions are also banned inside Vue templates, through a separate ESLint rule.
- Linting and formatting cover `resources/`, `tools/` and the root config files. `docs/`, `AGENTS.md` and `README.md` are excluded.
- Larastan analyses the app, config, database and routes folders. It does not analyse `tests/`.
- Route helpers are regenerated on every check and are not committed.
- The pre-commit hook runs the full check and gitleaks, a secret scanner. It is switched on once per clone with `git config core.hooksPath .githooks`.
- CI runs the check on every push, then the fit test, then audits production dependencies only.
- The fit test is `composer check:fit`, added on 13 October 2026. It builds the site's assets and runs the Pest browser tests under `tests/Browser`, which the check command leaves out. They use pestphp/pest-plugin-browser and Playwright, with a headless Chromium that is part of the Docker image; the Playwright version in the Dockerfile and in `package.json` must be the same.
- Stylelint and an ESLint rule reject hard-coded colours everywhere except the tokens file, `resources/css/tokens.css`.
- The development-only pages under `/dev` are left out of production builds. `npm run build:dev` makes a build that includes them, for checking on a phone.

**Tests that matter most**

- Tests are kept to a small fixed set. There is no general unit-testing practice and no coverage target; the static checks cover the rest.
- Golden tests for the control and hanging-piece rules: fifteen to twenty hand-verified positions covering every definition and consequence listed under square control. These are written before the import code, because errors there store wrong answers without any visible failure.
- Import twice and confirm every game and puzzle keeps the same ID.
- Replay short made-up games that include castling on both sides, a promotion and an en passant capture, and confirm they replay correctly. The games are made up because imported game data is never committed.
- Extract made-up games with one of them on the exclusion list, and confirm it is skipped and reported.
- Extract made-up puzzle rows with hand-written positions, and confirm each rule: four moves only, the same piece on both solver moves, no puzzle ending in checkmate, a capture on the last move with en passant counted, a promoting pawn filed under pawn, castling filed under king, an illegal move rejected, and the same per-piece cut on every run.
- Play made-up puzzles through the tactics play logic, and confirm each rule: a correct first and second move solves the puzzle; a wrong first move fails it and the retry starts from the same position; a wrong second move after a correct first move fails it; a later correct answer still leaves it failed; show solution plays only the missed move, and the arrows then reach every position from the setup to the end; redo resets the board but keeps the result; auto next moves on only after a solve, and anything pressed during the pause cancels it; and a promotion move counts the promotion piece.
- Choose puzzles from made-up ID lists, and confirm each rule: easiest first with equal ratings by ID; seen puzzles left out; all pieces as one list across the pieces; an empty pool when everything is seen; a puzzle seen in its piece's category left out of all pieces; and clearing one piece leaves the others' seen records alone.
- Extract made-up practice games, and confirm each rule: a missing rating, an abandoned game, a rules infraction, another time control, a player at the rating limit, a bot player, a game that is too short or too long and an illegal move are each skipped and reported; no player name reaches the output; the family cap and the length bands hold; and the same games are chosen in the same order on every run.
- Load made-up practice games where one has an answer list holding something that is not a square, and confirm the line is rejected and nothing is written.
- Work through made-up practice games in the square-control phase logic, and confirm each rule: squares are marked and unmarked; marks that exactly match the answer, with at least one square marked, end the phase at once as correct; a wrong square is shown at once and fails the phase, even when it is unmarked and the set is then completed; an empty answer is only confirmed with the button, which reads "Nothing" with no square marked and "Show me" otherwise; pressing the button ends the phase, and a missed square fails it; every phase is scored exactly once; a phase that has ended cannot be changed; an ordinary move has two phases and a castling move four, each with its own piece and answer; the next move plays after the last phase of a move; the game is finished after the last phase of the last move; and rewind keeps the marks and switches off when a phase ends and on a new move.
- Work through the same made-up games in spot the hanging piece, and confirm each rule: every move has one phase, castling as well; a hanging piece of either side is in the answer; marking nothing is right when nothing hangs; the next move plays after each phase; and the game is finished after the last move.
- In both marking modes, confirm moving on by itself: a phase that is exactly right moves on after the pause and not before, to the next phase or the next move; a phase ended with a square missed or wrong never does; in square control a set completed after a wrong square moves on although the phase failed, and a "Nothing" that is right moves on as well; in spot the hanging piece marks that match the answer do nothing until they are submitted, and a wrong square is not shown before then; rewind during the pause cancels it for good; the button during the pause moves on at once and only once; and the end of a game waits for the button.
- Request the two practice-game endpoints with made-up games, and confirm each rule: the ID list in ID order, and empty when nothing is loaded; a game with its moves and answers and no field the screen does not use; the cache header, no cookie and no CORS header; a 404 for an unknown ID and for an ID that is not a whole number, with no public cache header; and the rate limit.
- Resize the board with a made-up settings store, and confirm each rule: the size is saved once when the resize ends and not during the drag; it is still there for the next puzzle without the settings being read again; a saved size is used on the next visit; and a resize made before the settings arrive is not overwritten by them.
- Open the four play screens in a headless browser with made-up games and puzzles, at 360×640, 375×550, 390×660 and 412×780, and confirm in each state (playing, after a wrong guess, looking back at a move, the end of a game, a failed puzzle with Show solution, the solution shown, a wrong square shown in square control, the feedback and rewind of both marking modes) that the page does not scroll in either direction, that the board is the full width at 360×640, 390×660 and 412×780, and that it is at least 280 pixels at 375×550.
- Read a small file packed in several zstd frames, and confirm it gives exactly the same lines as the same file in one frame, including a line that spans a frame boundary.

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
| 10. Tables | Migrations for `masters` and `master_games`, and the seeder for the masters | Migrations run, and the constraints reject a deliberately bad row |
| 11. Import on a sample | `extract:masters` and `import:master-games`, run on about twenty games | The games load, a second run adds nothing and changes no ID, and the report lists what was skipped |
| 12. Data endpoint | `GET /api/master-games/{id}` with its generated TypeScript type | The response matches Appendix F, carries the cache header, and sets no cookie |
| 13. Play screen | Guessing through one game: the opponent delay, one attempt per move, feedback, and the running score. Nothing is saved yet | A full game can be played on a phone |
| 14. Saving | The storage module; resuming; several games in progress; replaying | Closing and reopening the browser resumes a game mid-way |
| 15. End of game | The score, the replay with guesses marked, the share summary, and stepping back and forward through the moves during the game and after it | A finished game can be reviewed and shared from a phone |
| 16. Browsing | The masters page; the game list with search, filters, paging, scores and in-progress markers; the random game button; the site's not-found page | A specific game can be found and started in a few taps |
| 17. Search engines | Titles and descriptions in the page source for every public page, and the sitemap; the `opponent_short_name` column, filled by the extract, and used in titles and the play screen header | A game page's source shows its title and description with scripts disabled |
| 18. Full import | All master games loaded. Done on 12 October 2026 into the local database: 5,772 games. They are loaded on the server once step 4 is done | Needs no further decisions: the game source and the minimum length are settled |

**Stage 4: Tactics by piece**

| Step | Build | Done when |
| --- | --- | --- |
| 19. Table and import | The `puzzles` migration; `extract:puzzles` and `import:puzzles`, run on the full Lichess file. Done on 12 October 2026 into the local database: 12,000 puzzles | The puzzles load, every puzzle obeys the same-piece rule, and a second run adds nothing |
| 20. Endpoints | The puzzle ID list and the fetch-by-IDs endpoint | Both match Appendix F |
| 21. Play screen | The setup move, the first move, the opponent's reply and the second move, fail then retry, and show solution | A puzzle can be solved and failed on a phone |
| 22. Categories and progress | The category page with the all pieces option; the easiest-first order; seen tracking; tallies; the reset when a category runs out | No puzzle repeats within a category until it is exhausted |
| 23. Full import | All puzzles loaded on the server, from the same intermediate file loaded locally in step 19 (`data/intermediate/puzzles.jsonl`, kept safe outside the repository), so the selection does not change. Refreshing from a newer Lichess file is not planned: imports never delete, so each refresh would add puzzles without removing any | Needs no further decisions: puzzle difficulty is settled |

**Stage 5: Square control and spot the hanging piece**

| Step | Build | Done when |
| --- | --- | --- |
| 24. Table and import on a sample | The `practice_games` migration; `extract:practice` with the calculation from step 7; `import:practice-games`. Done on 13 October 2026 into the local database: 500 games, from the first 1.5 GB of the September 2026 file | The sample loads, and neither the intermediate file nor the database holds a username |
| 25. Answer viewer | A development-only page at `/dev/answers` that steps through an imported game and shows the stored answers on the board and as lists: three for an ordinary move, five for castling | You have checked several games by eye and found no wrong answer |
| 26. Marking screen | The three phases on one game: tap to mark, submit, feedback showing missed and wrong squares, and the rewind button. Nothing is saved yet. After the step, on 13 October 2026, the screen was split into the two modes: two phases in square control, one in spot the hanging piece, and moving on by itself after a phase that is exactly right | A full game can be worked through comfortably on a phone |
| 27. Session | For both modes, each with its own progress: next game; resuming at the exact move and phase; seen games | Closing and reopening the browser resumes at the same phase in each mode, and a game finished in one mode is still served in the other |
| 28. Tallies | For square control, the two phase scores and the tallies by piece; for spot the hanging piece, its one score | The numbers match a session counted by hand |
| 29. Full import | All practice games loaded on the server, from the same intermediate file loaded locally in step 24 (`data/intermediate/practice-games.jsonl`, kept safe outside the repository), so the 500 games do not change | Needs no further decisions: game selection is settled |

**Stage 6: Finish**

| Step | Build | Done when |
| --- | --- | --- |
| 30. Progress page | Stats for the four modes, the install note, the Safari note, and reset progress | The page matches what was played, and reset clears it |
| 31. Settings | Board themes, piece sets, sound, move input, opponent delay, and marking palettes | Each setting takes effect at once and survives a reload |
| 32. Installable | The web app manifest and icons | The site installs to a phone's home screen, and the iPhone carry-over question is answered by a test |
| 33. Remaining pages and states | The home page with the four modes, in an order decided in this step (plain links to `/guess`, `/tactics`, `/squares/play` and `/hanging/play` stand in until then); about, credits, privacy, the report a problem links, and loading and failure states | Every page exists, and a failed load shows a retry button |
| 34. Launch check | Licences and credits; the Cloudflare cache rule, strict encryption, Rocket Loader off, and the server firewall; analytics; error tracking; a test restore of a backup | Every item is confirmed on the live site |

## Open decisions and later features

Two decisions are still open. The source of master games, their minimum length, puzzle difficulty and the selection of practice games are settled. None of them blocks starting the build.

**Open decisions**

| Decision | Applies to | What needs deciding |
| --- | --- | --- |
| Game selection | Square control | Decided on 13 October 2026, after a report on the first 4.9 million games of the September 2026 file: 500 games with the time control `600+0`, both players under 1200, no bot players, 30 to 120 plies, at most 25 per opening family, spread evenly over three length bands. Appendix E has the exact rule |
| Puzzle difficulty | Tactics by piece | Decided on 12 October 2026: a rating of at most 1500, a popularity of at least 80, at least 500 plays, and 2,000 per piece, taking the most popular, then the most played, then by puzzle ID. Puzzles are served easiest first within a category |
| Minimum game length | Guess the move | Decided on 11 October 2026 that there is no minimum; changed on 12 October 2026 to two plies, after the full extract turned up eight games forfeited after one move |
| Source of master games | Guess the move | Decided on 11 October 2026: PGN Mentor's free per-player files, one per master. The site states no licence beyond "completely free", so only moves and basic details are imported, annotations are stripped, and PGN Mentor is credited on the credits page |
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
- Showing puzzle theme labels
- Automated browser tests at phone size for the four core flows
- More board themes and piece sets
- A desktop layout with the board beside a panel, which needs its own mockups

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
| Phase name | `lost`, `controlled`, `hanging`: the three stored answer sets. The first two are the phases of square control, and the third is the one phase of spot the hanging piece |  |
| ID | Integer assigned by the database |  |

**Rules**

- Squares are names, not numbers. Chessground and chess.js both use names, so no numbering scheme is needed.
- Two moves are equal when their from-square, to-square and promotion letter are equal. Written notation is never compared.
- A board may report castling as the king moving onto its rook. That is normalized to the king's two-square move before any comparison.
- Every game starts from the standard starting position. Anything else is rejected at import.
- Two sets are equal when they hold the same squares. Sorting only keeps stored data stable between imports.
- Each data shape is defined once, as a PHP data class, and its TypeScript type is generated, using spatie/laravel-data and spatie/laravel-typescript-transformer. The types are generated on every check and are not committed. This includes the entries inside the `moves` lists.

## Appendix B: The control and hanging calculation

This is the exact procedure the import follows for every move of a practice game. It turns the definitions under Mode 2 into steps. Square control asks for `lost` and `controlled`, and spot the hanging piece for `hanging`.

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
5. Castling: do steps 1 to 4 separately for the king and for the rook. `lost` and `controlled` are the king's alone. The rook's two sets are stored apart, as `rook.lost` and `rook.controlled`. On every other move `rook` is null.
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

White has the king on e1, a rook on h1, the queen on d1, and pawns on d2, e2, f2, g2 and h2. The squares f1 and g1 are empty. Black's king is on e8, where it affects no answer. White castles, `e1g1`.

| Piece | Before set | After set | Lost |
| --- | --- | --- | --- |
| King, e1 to g1 | d1, d2, e2, f1, f2 | f1, f2, g2, h1, h2 | d1, d2, e2 |
| Rook, h1 to f1 | e1, f1, g1, h2 | d1, e1, f2, g1 | f1, h2 |

- `lost`, the king's: `d1`, `d2`, `e2`
- `controlled`, the king's: `f1`, `f2`, `g2`, `h1`, `h2`
- `rook.lost`: `f1`, `h2`
- `rook.controlled`: `d1`, `e1`, `f2`, `g1`

The squares `f1` and `h2` are lost by the rook and controlled by the king. No square is in both answers of the same piece.

All three examples, and the rook example under Mode 2, belong in the golden tests.

## Appendix C: Database schema

The MVP has four content tables and nothing about users. Every column is not-null unless marked nullable, and every table also has the standard created and updated timestamps.

**`masters`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `slug` | text | Unique; lowercase letters only, used in URLs, for example `capablanca` |
| `name` | text | Display name |
| `sort_order` | smallint | Unique; display order: Morphy, Lasker, Rubinstein, Capablanca, Alekhine, Keres, Smyslov, Botvinnik, Tal, Spassky, Fischer |

The eleven rows are created by a seeder kept in the repository, with the display names Paul Morphy, Emanuel Lasker, Akiba Rubinstein, José Raúl Capablanca, Alexander Alekhine, Paul Keres, Vasily Smyslov, Mikhail Botvinnik, Mikhail Tal, Boris Spassky and Bobby Fischer. The seeder is safe to rerun and never changes an ID; adding a master may change other masters' display order, but never their IDs or slugs.

**`master_games`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `master_id` | bigint | The winner; foreign key to `masters`, deletion restricted |
| `fingerprint` | char(64) | Unique; see Appendix D |
| `master_color` | text | `white` or `black` |
| `opponent_name` | text | Written as first name then last name |
| `opponent_short_name` | text | Nullable; the family name, taken from the part of the source name before the comma, for titles and the play screen header. Added in build step 17; where it is null, the full name is shown |
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
| `answers_version` | smallint | The version of the calculation in Appendix B that produced the answers. It started at 1 and has been 2 since 13 October 2026, when the rook's answers on a castling move were stored apart from the king's |
| `moves` | jsonb | Array with one entry per ply, in order; its length equals `ply_count` |

A `moves` entry:

```json
{
  "uci": "g1f3",
  "san": "Nf3",
  "piece": "knight",
  "lost": ["e2", "f3", "h3"],
  "controlled": ["d2", "d4", "e1", "e5", "g1", "g5", "h2", "h4"],
  "rook": null,
  "hanging": ["e5"]
}
```

On a castling move `piece` is `king`, `lost` and `controlled` are the king's alone, and `rook` holds the rook's two sets:

```json
{
  "uci": "e1g1",
  "san": "O-O",
  "piece": "king",
  "lost": ["d1", "d2", "e2"],
  "controlled": ["f1", "f2", "g2", "h1", "h2"],
  "rook": { "lost": ["f1", "h2"], "controlled": ["d1", "e1", "f2", "g1"] },
  "hanging": []
}
```

Every entry carries the `rook` field, and it is null on every move that is not castling.

No usernames and no Lichess game ID are stored, since the ID links back to the players.

**`puzzles`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint | Primary key |
| `lichess_id` | text | Unique; Lichess's own puzzle ID |
| `fen` | text | The position before the opponent's setup move, exactly as Lichess gives it |
| `setup_move` | text | The opponent's move that plays first |
| `first_move` | text | The solver's first move |
| `reply_move` | text | The opponent's reply |
| `second_move` | text | The solver's second move, always a capture and never checkmate |
| `piece` | text | The category; one of the six piece types |
| `rating` | smallint | Lichess puzzle rating; between 0 and 4000 |
| `popularity` | smallint | Between -100 and 100 |
| `plays` | integer | Number of times played on Lichess; at least 0 |
| `themes` | jsonb | Lichess's theme labels, a list of strings exactly as Lichess gives them. Stored but not shown anywhere yet |

Every puzzle is two solver moves long, so no move column is nullable. The `ends_in_mate` column was dropped on 12 October 2026, before the table was first created, because no puzzle ends in checkmate.

**Constraints and indexes**

- Check constraints enforce every fixed set and range above: the two colours, the six piece types, the rating, year and popularity ranges, and the slug format.
- `guess_count` is between 1 and `ply_count`.
- Each `moves` column is a JSON array whose length equals `ply_count`.
- On `puzzles`, `plays` is at least 0 and `themes` is a JSON array.
- Indexes: `master_games (master_id, year)` and `puzzles (piece)`.
- Search on opponent and event uses a case-insensitive match. No special index is needed at this size. Each fingerprint column has a check constraint requiring 64 lowercase hexadecimal characters, so the same game can never be stored twice under different spellings of its fingerprint. Migrations for content tables have no rollback, so a rollback can never drop imported games.
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
- For puzzles, the update option rewrites every column except `lichess_id`.
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
| Square control and spot the hanging piece | `npm run extract:practice` | `php artisan import:practice-games` |
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

They are options so that the values can change without code changes.

| Command | Option | Meaning | Default |
| --- | --- | --- | --- |
| `extract:masters` | `--min-plies` | Shortest game kept | 2, which leaves out games forfeited after one move. Decided on 12 October 2026 |
| `extract:masters` | `--exclude-events` | Words in the event or site that exclude a game | sim, simul, blindfold, odds, consultation, blitz, rapid, each matched as a whole word. Digits may follow the word, so "rapid" also matches "rapid45" |
| `extract:practice` | `--time-control` | The only time control kept, compared with the game's `TimeControl` tag exactly | `600+0`, which is 10-minute rapid with no increment. Decided on 13 October 2026 |
| `extract:practice` | `--max-rating` | Rating limit. Both players must be under it | 1200. Decided on 13 October 2026 |
| `extract:practice` | `--min-plies` | Shortest game kept | 30. Decided on 13 October 2026 |
| `extract:practice` | `--max-plies` | Longest game kept | 120. Decided on 13 October 2026 |
| `extract:practice` | `--limit` | How many games are chosen | 500. Decided on 13 October 2026 |
| `extract:practice` | `--per-family` | Most games chosen per opening family | 25. Decided on 13 October 2026 |
| `extract:puzzles` | `--max-rating` | Highest puzzle rating kept | 1500. Decided on 12 October 2026 |
| `extract:puzzles` | `--min-popularity` | Lowest popularity kept | 80. Decided on 12 October 2026 |
| `extract:puzzles` | `--min-plays` | Fewest plays kept | 500. Decided on 12 October 2026 |
| `extract:puzzles` | `--per-category` | Most puzzles kept per piece | 2000. Decided on 12 October 2026 |

**Master games: extract rules**

- A configuration file lists each master's slug with the name spellings found in the sources.
- The result must be a win, and the winner's name must match one of the masters.
- Winners that match no master are counted by name in the report, so a missing spelling is noticed.
- A game with a custom starting position, shown by a `SetUp` or `FEN` tag, is rejected.
- An exclusion list, `tools/import/masters-exclude.json`, names single games to leave out, such as odds games the source does not label and incomplete duplicates. Each entry has the game's fingerprint and a note: the players, the event, the year and the reason. A listed game is skipped and counted under "excluded by list", and the report says which entries were found in the input.
- Comments, side variations and annotation symbols are removed.
- `year` is the first four digits of the date when they are digits, otherwise null.
- `opponent_name` is rewritten from last name, first name to first name then last name.

**Practice games: extract rules**

- The source is a monthly file of standard rated games. It is read as a stream while still compressed, so it is never unpacked in full.
- Ratings come from the `WhiteElo` and `BlackElo` tags. A game missing either is skipped.
- Games that ended by abandonment or a rules infraction are skipped.
- A game is kept only if its `TimeControl` tag is exactly `--time-control`, and both ratings are under `--max-rating`. A rating equal to the limit is not under it.
- A game where either player has the title `BOT`, in the `WhiteTitle` or `BlackTitle` tag, is skipped.
- A game shorter than `--min-plies` or longer than `--max-plies` is skipped.
- The games are not taken in file order. Every game that passes the rules above is collected, and `--limit` of them are chosen as described under "Practice games: choosing the games".
- Player names, the game link, and clock and evaluation comments are dropped.
- Each move's answers are calculated as in Appendix B. Every move in the intermediate file carries the `rook` field: the rook's two sets on a castling move, and null otherwise. The load refuses a move without it, so a file written before answers version 2 cannot be loaded by mistake.

**Practice games: choosing the games**

Decided on 13 October 2026. The aim is a mix of openings and of game lengths, and the same choice on every run.

- The opening family of a game is its `Opening` tag up to the first colon, so "Sicilian Defense: Bowdler Attack" belongs to "Sicilian Defense". A game with no `Opening` tag belongs to the family `?`.
- There are three length bands: short, up to 49 plies; medium, 50 to 73 plies; and long, 74 plies or more. With the default limits these are 30 to 49, 50 to 73 and 74 to 120.
- Each band takes a third of `--limit`. When the limit does not divide by three, the shorter bands take the remainder, so 500 gives 167, 167 and 166.
- The games are put in order of the SHA-256 of their moves as written in the file: standard notation, joined by single spaces, without move numbers, comments, annotation symbols or the result. This order does not depend on the order in the file.
- The games are taken in that order. A game is chosen when its band is not full and its family has fewer than `--per-family` games. Otherwise it is passed over.
- A chosen game is then replayed. One with an illegal move is skipped, and its place stays open for a later game. One with the same moves as a game already chosen is skipped as well.
- When the input holds too few games to fill a band, fewer than `--limit` are chosen, and the report says how many each band got.
- The report counts the chosen games by band and by opening family.
- The same input and options always give the same games in the same order. A different input file gives a different choice; loading it adds games and removes none.

**Puzzles: extract rules**

- The Lichess file has the columns `PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, GameUrl, OpeningTags, DailyDate`. Columns are read by name, not by position.
- The source file is read while still compressed, one frame at a time, so it is never unpacked in full. A plain `.csv` file is read as well.
- The first move in `Moves` is the opponent's setup move. The rest alternate, starting with the solver.
- Only puzzles with exactly four moves are kept, which is two solver moves.
- Same-piece rule: the solver's second move must start on the square where the solver's first move ended.
- A puzzle whose last move is checkmate is skipped. This is found by replaying the puzzle.
- A puzzle is kept only if the solver's last move is a capture. Any capture counts, of a piece or a pawn, and so does en passant.
- `piece` is the type of the piece making the solver's first move, before any promotion.
- `themes` is the `Themes` column split at its spaces, with nothing changed or left out.
- When a category has more puzzles than `--per-category`, the most popular are kept, then the most played, then by puzzle ID, so the choice is the same on every run.
- The game link is not stored.

## Appendix F: Pages and data endpoints

Inertia serves the pages, and a small set of read-only endpoints serves game and puzzle data. The browser decides which item to fetch; the server only serves items by ID.

**Pages**

| Path | Page |
| --- | --- |
| `/` | Home, with the four modes |
| `/guess` | The masters |
| `/guess/{master}` | Game list for one master, by slug |
| `/guess/{master}/random` | Redirects to a random game by that master |
| `/guess/{master}/{game}` | Play a master game |
| `/squares` | Square control landing page: the two phase percentages and a Start or Resume button |
| `/squares/play` | The square-control exercise |
| `/hanging` | Spot the hanging piece landing page: the percentage and a Start or Resume button |
| `/hanging/play` | The spot the hanging piece exercise |
| `/tactics` | The piece categories |
| `/tactics/{piece}` | Play tactics; `piece` is one of the six piece types or `all` |
| `/progress`, `/settings`, `/credits`, `/privacy` | As named |
| `/sitemap.xml` | Lists the home page, `/guess`, the master pages and master game pages; cached publicly for one hour |
| `/about` | About |

- The game list is sorted by year and shows 30 games per page.
- Its query parameters are `q`, `color`, `year_from`, `year_to` and `page`. The search box `q` matches opponent and event, which is how those two are filtered.
- The list receives each game's details as page data, never its moves.
- Every public page's source carries a readable title and meta description, written by the server, such as "Guess the move: Capablanca vs. Marshall, New York 1918".
- An address that matches no page, including a master or game that does not exist, shows the site's own not-found page in the site's style rather than the framework's default. It is built with browsing in step 16.

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

A fetch-by-IDs response:

```json
{
  "items": [
    {
      "id": 101,
      "lichess_id": "abcde",
      "fen": "r2k4/8/8/3N4/8/8/8/6K1 b - - 0 1",
      "setup_move": "d8e8",
      "first_move": "d5c7",
      "reply_move": "e8d7",
      "second_move": "c7a8",
      "piece": "knight",
      "rating": 870
    }
  ]
}
```

A practice game ID list response:

```json
{ "ids": [1, 2, 3] }
```

A practice game response:

```json
{
  "id": 7,
  "ply_count": 64,
  "answers_version": 2,
  "moves": [
    {
      "uci": "g1f3",
      "san": "Nf3",
      "piece": "knight",
      "lost": ["e2", "f3", "h3"],
      "controlled": ["d2", "d4", "e1", "e5", "g1", "g5", "h2", "h4"],
      "rook": null,
      "hanging": ["e5"]
    }
  ]
}
```

**Rules for the practice-game endpoints**

Settled in build step 26.

- The ID list is ordered by ID, so it is the same on every request. With no games loaded it is an empty list, not an error.
- A game carries only what the screen uses: its ID, `ply_count`, `answers_version` and `moves`, with each move as in Appendix C. The ratings, the time control and the fingerprint are not sent.
- The ID in the address must be 1 to 18 digits. Anything else is a 404, like an unknown ID.

**Rules for the puzzle endpoints**

Settled in build step 20.

- The ID list is ordered by rating, then ID, so it is the same on every request.
- `piece` must be one of the six piece types. Anything else returns 422, including a missing or empty `piece` and `all`: the browser makes the all pieces list from the six lists.
- `ids` must be whole numbers separated by commas, with nothing else. A missing, empty or non-numeric list returns 422.
- At most 20 IDs may be listed. They are counted as written, before repeats are removed, and a longer list returns 422.
- An ID that names no puzzle is left out of the answer. If none of them exist, the answer is an empty `items` list, not an error.
- A repeated ID is returned once. Puzzles come back in the order their IDs were first asked for.
- Each puzzle carries `lichess_id`, so the report a problem link can point at `lichess.org/training/<id>`.
- The theme labels, `popularity` and `plays` are not sent, because they are not shown anywhere yet.

**How the browser chooses**

- Square control and spot the hanging piece: the browser fetches the ID list, picks at random an ID it has not played in that mode, and fetches that game. Both modes use the same two endpoints.
- Tactics: the browser fetches the ID list for the category, removes the puzzles it has seen, takes the lowest-rated of the rest, and fetches the next few in one request. For the all pieces option it combines the six lists into one, by rating and then by puzzle ID.
- This makes "no repeats until the category runs out" exact, and every response the same for every visitor.
- Ratings are in the ID list so that the easiest-first order is worked out in the browser alone.

**Rules for the endpoints**

- They are stateless: no session and no cookies. A response that sets a cookie is not cached by Cloudflare.
- Each response carries a public cache header with the time shown above, and a Cloudflare cache rule covers `/api/*`.
- After an import that uses the update option, the Cloudflare cache is purged. Newly added items appear within an hour without a purge.
- An unknown ID returns 404, and so does an ID in the address that is not a number. An invalid query parameter returns 422. Both have a JSON body with a message. Every 404 under /api uses one fixed message that does not repeat the requested address. The endpoints send no CORS header, so other websites cannot read them from a visitor's browser; the site's own pages are same-origin and do not need one. Error responses carry no public cache header, so a game imported later is never hidden behind a cached "not found".
- Requests are limited to 120 per minute per visitor, a placeholder value.
- Laravel is configured to trust Cloudflare's forwarding headers. Without that, every visitor appears to come from Cloudflare's address and they all share one limit.
- Each response shape is a PHP data class with a generated TypeScript type.

## Appendix G: Browser storage

All user data lives in one IndexedDB database in the browser, opened through the `idb` library. The database is named `chess-training` until the site has a name. It started at version 1 and has been at version 2 since 13 October 2026, when the three `hanging` stores were added for spot the hanging piece. Nothing had been written to the three `square` stores by then, so their record shapes changed without a conversion.

**Stores**

| Store | Key | Holds |
| --- | --- | --- |
| `meta` | Fixed key `meta` | The schema version and the date of first use |
| `settings` | Fixed key `settings` | The user's settings. Only the settings that have been chosen are stored; a setting that is missing takes its default |
| `masterGames` | `gameId` | One record per master game started: the attempt in progress and the last finished result |
| `squareSession` | Fixed key `current` | Where the user is in square control |
| `squareSeen` | `gameId` | Practice games finished or abandoned in square control |
| `squareTallies` | Fixed key `tallies` | Attempts and correct answers per phase and per piece |
| `hangingSession` | Fixed key `current` | Where the user is in spot the hanging piece |
| `hangingSeen` | `gameId` | Practice games finished or abandoned in spot the hanging piece |
| `hangingTallies` | Fixed key `tallies` | Attempts and correct answers in spot the hanging piece |
| `puzzlesSeen` | `puzzleId` | Puzzles attempted |
| `tacticsTallies` | Fixed key `tallies` | Attempts and solves per piece |

**Record shapes**

```ts
type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
type SquarePhase = 'lost' | 'controlled'
type Tally = { attempts: number; correct: number }
type Guess = { uci: string; correct: boolean }

type Settings = {
  appearance: 'light' | 'dark' | 'system' // default 'system'
  boardTheme: string
  pieceSet: string
  boardSizePx: number | null // larger screens only; null means the 560 default
  sound: boolean
  moveInput: 'tap' | 'drag' | 'both'
  opponentDelaySeconds: number // 1 to 5, default 3
  markingPalette: string
  tacticsAutoNext: boolean // default false
}

type MasterGameRecord = {
  gameId: number
  masterSlug: string
  finished: { correct: number; total: number; guesses: Guess[]; finishedAt: string } | null
  current: { guesses: Guess[]; startedAt: string; updatedAt: string } | null
}

type SquareSession = { gameId: number; ply: number; phase: SquarePhase; rook: boolean; updatedAt: string }

type SquareSeen = { gameId: number; status: 'finished' | 'abandoned'; at: string }

type SquareTallies = Record<SquarePhase, Record<PieceType, Tally>>

type HangingSession = { gameId: number; ply: number; updatedAt: string }

type HangingSeen = { gameId: number; status: 'finished' | 'abandoned'; at: string }

type HangingTally = Tally // the one record in hangingTallies

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
- `rook` is true only on a castling move, while the next phase to submit is the rook's lost or controlled phase. With it, `phase` tells the four phases of a castling move apart.
- A phase is added to the tallies at the moment it is submitted, under the type of piece that moved. On a castling move the king's lost and controlled phases are added under the king, and the rook's under the rook. Resuming continues at the exact phase, so nothing is counted twice.
- The session is saved when a phase is submitted, pointing at what comes next. Leaving during the pause after a phase that was exactly right therefore resumes at the next phase or move.
- Marks that were not submitted are not saved.
- The percentage shown for a phase is the total across the six piece types.
- Pressing next game before the end records the game as abandoned.
- When every practice game is in `squareSeen`, that store is cleared.

**Spot the hanging piece**

- The mode's progress is its own. Nothing here reads or writes the three `square` stores, and square control does not touch the three `hanging` stores, so a game seen in one mode is still unseen in the other.
- `ply` is the move being worked on. Each move has one phase, so the move is all that is needed to resume.
- The phase is added to the one tally at the moment it is submitted. There is no split by piece.
- The session, unsubmitted marks, next game and abandoned games work as in square control.
- When every practice game is in `hangingSeen`, that store is cleared.

**Tactics**

- `tacticsAutoNext` in the settings is the Auto next toggle on the tactics play screen. It is saved when the toggle is pressed and read when the play screen opens, in every category.
- A puzzle is recorded at the first attempt, and `solved` is the result of that attempt. It is recorded once that result is decided: at the first wrong move, or at the final capture. The tally of the puzzle's own piece is counted at the same moment, and a puzzle already recorded is not counted again.
- There is one record per puzzle, whichever category it was played in.
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
| `resources/js/marking/` | The phase logic and the wording shared by square control and spot the hanging piece |
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
