# Chess training site: product requirements

Last updated: 19 October 2026

A free, open source, mobile-first chess training site with four modes: guess the move against eleven masters, a square-control drill on beginner games, spotting hanging pieces in the same games, and short tactics that end in a capture, grouped by piece. The MVP has no accounts, and all progress is kept in the browser.

## MVP scope

The MVP is four training modes served from a read-only library, with nothing to log in to. The site is free, not intended to make money beyond possible donations, and its code is public.

**In the MVP**

- Guess the move, with games from eleven masters
- Square control, on games by players rated under 1200
- Spot the hanging piece, on the same games
- Tactics by piece, two moves long, each ending in a capture
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
- The progress page shows the user's accuracy for each master: correct guesses out of all guesses, as a percentage, counted over finished games only and using each game's latest finished result. Masters are listed from highest to lowest accuracy, each as a row with the master's family name, "4 games, 131 moves" under it, and the percentage on the right, for example Capablanca with 72%. Masters with no finished game are not listed. Nothing new is stored; it is worked out from the saved game records.

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
- 4,000 games are loaded, between 30 and 120 plies long, chosen for a mix of openings and game lengths. Appendix E has the exact rule. There were 500 at first; on 18 October 2026 they were grown to 4,000, keeping the first 500 and their IDs.
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
| Pins | Ignored for control: a pinned piece still controls every square it attacks. For hanging, pins to the king count: a piece pinned to its own king can capture only along its pin line, but it still stops the other side's king from capturing on a square it attacks, as set out in Appendix B, step 6. Pins to the queen or any other piece are ignored. Decided on 16 October 2026, and worded for the exchange on 18 October 2026 |
| Hanging | The other side can win material by capturing on the piece's square. This is worked out by an exchange on that square, set out in Appendix B, step 6: the sides take turns capturing there, each with its cheapest piece, either side may stop, and the piece is hanging if the attacking side comes out ahead. An even trade is not hanging. Pieces lined up behind a capturer take part in turn, and a king captures only when nothing of the other side still attacks the square. Decided on 18 October 2026, replacing three counting rules used from 16 October 2026 |
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
- A phase that ends as "Corrected" counts as failed, like any phase that is not exactly right.
- A percentage is the phases that scored out of the phases counted, rounded down to a whole number, so 100% shows only when every counted phase scored. Until a phase has been counted it shows a dash, "—", in the same room. The tallies by piece are kept but not shown. Settled in build step 28, as are the points below.
- On the play screen the percentages share the legend's room under the board: while a phase is being marked, the room holds one line, "Lost 82% · Controls 74%", with the tab names as labels; once the phase ends, the legend takes it over. There is no row of its own, so the screen keeps its height. A percentage changes when a phase is counted, so the new figure shows as the next phase opens.
- If storage is unavailable, the phases played during the visit are counted in memory, and the percentages show them until the page is reloaded.
- A phase checks itself as it is marked, and there is no Submit in this mode. Decided on 13 October 2026, after the split into two modes; spot the hanging piece keeps Submit.
- Exactly right: when the marked squares exactly match the answer, with at least one square marked, the phase ends and counts as correct. It shows the tick and "Exactly right" for about 0.6 seconds, a named value, and then moves on by itself: to the next phase or, after the last phase of a move, to the next move, which plays.
- Wrong square: marking a square that is not in the answer shows it as wrong at once, drawn as a wrong square is in the feedback, and the phase counts as failed. The user can unmark it and keep going. If they then complete the set, the phase ends and still counts as failed. It shows "Corrected" in the wrong colour, never "Exactly right", with a cross in the phase indicator, and after the same pause it moves on by itself as above. "Exactly right", in the accent colour with a tick, is only for a phase in which no wrong square was marked at any point.
- An empty answer is only confirmed by pressing the main button, which reads "Nothing" while no square is marked. A "Nothing" that is right moves on by itself in the same way, as "Exactly right", or as "Corrected" if a square had been marked and unmarked first.
- Pressing the main button ends the phase, whatever is marked. The feedback then appears: missed squares are highlighted, and wrongly marked squares are shown in a second colour. The phase counts as failed unless the selection was exactly right and no wrong square was marked on the way. If anything is missed or wrong, it stops on the feedback and the button continues.
- Rewind during the pause cancels the move on. The feedback then stays, and the button continues. Pressing the button during the pause moves on at once.
- The end of a game never moves on by itself: after the last phase of the last move it stops on "Next game", even when the phase was exactly right.

**Sessions**

- Sessions are open-ended. The user goes for as long as they like, and returning resumes at the same move.
- A next game button serves a random game. A game can also be opened by its number; see Games by number below. The mode opens on a landing page at /squares that shows the two phase percentages and a Start or Resume button. The exercise itself runs at /squares/play.
- The session, the seen games and the scores are this mode's own. A game played in spot the hanging piece is not used up here.
- The board is shown with White at the bottom.
- A rewind button shows the position before the move. The move's squares are not highlighted in this mode. Phase 1 depends on that earlier position, and a user resuming a session did not just watch the move.
- The landing page shows the heading "Square control" and one line under it: "Watch a beginner game move by move, and mark the squares each moved piece gave up and now controls." The same line is the page's meta description. The page offers Resume while the mode has a saved session, and Start otherwise, including when storage is unavailable. Both open /squares/play, which resumes the session if there is one. Settled in build step 27, as are the points below; the layout of the buttons changed on 14 October 2026, see Choosing the next game below.
- Between the line and the button, the landing page shows the two percentages, labelled "Squares lost" and "Squares controlled", with a dash for one that has nothing counted. Settled in build step 28.
- Under each of the two percentages, two small muted lines compare the last seven days with the seven before: "Last 7 days 70%" and, under it, "The 7 before 60%". The last seven days are today and the six days before it, and the seven before are the seven days before those, by the dates of the browser's own time zone. A line's percentage is rounded down, like the others, and shows only once its seven days hold at least 20 counted phases of that phase; until then it shows a dash, "—". There are no arrows, colours or words judging the change. Each phase is counted under the day it was counted on, in the results by day of Appendix G, which began on 19 October 2026: earlier play counts in the percentages above but in neither window. Added on 19 October 2026.
- A game is picked at random from the games not yet seen in this mode, of the chosen game length, never the game just played, and it becomes the session at once, at move 1 or after the skipped opening. Leaving before marking anything resumes the same game.
- Resuming at a move's first phase plays the move as usual: the position before it for about 0.8 seconds, then the move. Resuming at a later phase of a move shows the position after the move at once, and rewind still shows the one before. The phase tabs show the earlier phases of that move with their tick or cross.
- The "Next game" button sits in the header, at the right. Pressed before the end of a game, even on a game with nothing marked yet, it records the game as abandoned and picks another, with the mode's current choices of game length and skipped opening. At the end of a game it does what the main button does.
- When every game of the chosen length has been seen in this mode, those games' seen records are cleared without a message, and picking starts again from all of them; see Choosing the next game below. The other mode's are left alone.
- If a saved session's game no longer exists, or its saved move or phase is not in the game, the session is deleted and a new game is picked without a message. If the game fails to load for another reason, the page says so and offers Try again, and the session is kept.

**Choosing the next game**

Added on 14 October 2026, after build step 33 and before the first deployment. The layout below was settled the same day.

- Below the percentages, the landing page has, in order: the game in progress, when there is one, and a "New game" section. Both are hidden until the browser has said whether there is a game in progress, so nothing moves or changes as the page opens.
- The game in progress sits between two hairlines, in the style of the Continue card on the Guess the move page: one line in the accent colour, "Game 1234 · Move 9 of 36", with the game's number, the move the session is at and the game's length in full moves as a game score counts them, then a primary Resume button. If the game list fails to load, the line reads "Game 1234 · Move 9". Until 18 October 2026 it began "Game in progress" instead of the number.
- The "New game" section has the heading "New game", then the game length choice, the skip the opening slider, and a button. With no game in progress the button is the main one, filled, and reads "Start", and a hairline separates the section from the percentages. While a game is in progress it is outlined and reads "Start new game", because starting abandons that game.
- The two buttons are the same size, the landing button size of the shared button component: centred, three quarters of the column wide and at most 320 pixels, and 44 pixels tall, the height of a tap target. The play screens keep their own buttons. No other landing page has a main button of this kind: the masters and the tactics categories are lists. Settled on 14 October 2026.
- Game length, labelled "Game length": Any, Short, Medium and Long, as a row of choices, with the range of the one chosen in a caption below: "15–60 moves", "15–24 moves", "25–36 moves" and "37–60 moves". The default is Any. Short, Medium and Long are the three length bands the games were chosen with (Appendix E): up to 49 plies, 50 to 73 and 74 or more. The captions count full moves, the moves both sides have made, so a 49-ply game is in Short as 24 full moves. A new game is picked only from that band.
- Skip the opening, labelled "Skip the opening": a slider from 0 to 10 full moves, both sides' moves, in whole moves. The default is 0. Its value is written beside its label, in the same small muted style: "Off" at 0, then "1 move", "5 moves" and so on; screen readers hear the same words. There is no other figure or caption. A new game starts at the position after the skipped moves, at White's next move. The skipped moves are played without being shown one by one, nothing is marked for them, and they are not counted in the tallies. The starting position is shown for about 0.8 seconds and the first move then plays, as at move 1. A game too short for the skip starts at its last move; with the import's 30-ply minimum this cannot happen.
- Both choices are remembered in the browser as settings of this mode, saved as soon as they change (the slider when it is let go). They are not on the settings page. Without storage they last for the visit.
- They apply to the next game picked: by Start, by "Start new game", by "Next game" on the play screen, and when a saved session's game cannot be resumed. A game in progress keeps going as it started; the grouping on the page shows this, so there is no note about it.
- Start new game, while a game is in progress: it records the current game as abandoned, as "Next game" does, picks a new game with the current choices, never the one just left, and opens the play screen on it. There is no confirmation step.
- When every game of the chosen band has been seen in this mode, that band's seen games are cleared without a message, and picking starts again from all of them. The mode's seen games in the other bands are kept. With Any, the band is every game, so the whole set is cleared, as before.
- If the chosen band holds no game at all, the play screen says "There are no games of this length yet." It cannot happen with the 4,000 games, which fill all three bands.

**Games by number**

Added on 18 October 2026, so that a coach can give a student a specific game.

- A game's number is its practice game ID, 1 to 4,000 today, which never changes. The play screen shows it under the title in the header, as "Game 1234" in the small muted label style, so the header keeps its height and the line above the question keeps its room.
- After the "New game" section, the landing page has a small "Open a game" section, below a hairline: the heading "Open a game", a number field labelled "Game number" and an outlined "Open" button. A number that is not in the game ID list shows "There is no game 1234." under the field, in the wrong colour, and nothing else happens. A number in the list opens the game's address.
- Each game has an address of its own, /squares/game/1234, that opens it in this mode. The number is digits only. An unknown number shows the site's not-found page.
- A game opened by number counts like any other: its phases count towards the mode's percentages and tallies, and finishing it records it as seen, finished.
- A game already finished can be opened again. It is played from the start and counts again.
- If another game is in progress in the mode, opening a game by number records that game as abandoned, as "Next game" does. There is no confirmation step. If the game opened is the game in progress, it simply resumes.
- A game opened by number always starts at move 1. The game length and skip the opening choices do not apply to it, so a coach and a student see the same game from the same start. They still apply to the next random game.
- After a game opened by number ends, the main button and "Next game" pick a random game as usual, and the screen moves to /squares/play, so a reload does not open the numbered game again.
- The other mode's session, seen games and scores are never touched.

**The marking screen**

Settled in build step 26, and shared with spot the hanging piece since 13 October 2026. What differs there is listed under Mode 4.

- The move plays on the board from the position before it, with no square highlighted, and phase 1 opens at once. It plays more slowly than moves elsewhere, about 450 milliseconds, so that it can be followed. Before the first move of a game the starting position is shown for about 0.8 seconds. Both are kept as named values. With reduced motion there is no animation.
- A line above the question names the move in words, with the move number as a game score gives it: "Move 2 · White played Nf3", "Black took on e5", "White took on d6 en passant", "White castled kingside", "White promoted to a queen on e8". The written move keeps its own case inside the uppercase label, because in capitals `bxc4` and `Bxc4` would read the same.
- The questions are "Which squares does the knight no longer control?" and "Which squares does the knight control now?". After a promotion the second question names the new piece: "Which squares does the new queen control?".
- The phase indicator has two tabs. On an ordinary move they are Lost and Controls. On a castling move they are King and Rook: each shows two small squares, the first in the lost colour and the second in the controls colour, and the question names the piece. The current tab is underlined in the colour of the phase being marked. Each phase's square turns into a tick when the phase scored and a cross when it failed.
- Rewind is a toggle, not a button to hold. While it is on, the button shows as pressed, the board shows the position before the move, and the line above the question starts "Before move 2". Squares can still be marked while the earlier position is shown, in every phase, and the marks are kept when it is switched off. Rewind switches off when a phase ends, so the feedback is first seen on the position after the move, and on every new move. It can be switched on again while the feedback is showing.
- While marking, a marked square that is not in the answer is drawn at once as a wrong square, in the feedback's red, and tapping it again unmarks it. Nothing else on the screen changes: the question stays, and the legend's room keeps the percentages until the phase ends.
- The main button reads "Nothing" while no square is marked, and "Show me" once at least one is. Either press ends the phase.
- After a phase ends, the line above reads "Move 2 · Controls · Not quite" in the wrong colour, or "… · Exactly right" in the accent colour, and the heading says how it came out: "Three squares missed, one extra." (wrongly marked squares were called "too many" until 18 October 2026, when "extra" replaced it as gentler), "All eight squares.", "Both squares.", "The only square." or "Nothing to mark, and nothing marked.". When a wrong square was marked and the set then completed, the line reads "Move 2 · Controls · Corrected" in the wrong colour, and the heading still describes the final selection, as in "Both squares.". On a castling move the line names the piece, as in "Move 5 · Rook · Lost · Not quite".
- The main button then names what comes next: "Next: squares controlled" and "Next move". On a castling move it reads, in order, "Next: king's squares controlled", "Next: rook's squares lost", "Next: rook's squares controlled" and "Next move". After the last phase of a game's last move the line above starts "End of the game" and the button reads "Next game". There is no end-of-game screen.
- Since build step 27 the screen resumes the mode's session, or picks an unseen game, and has the "Next game" button in the header; see Sessions above. Since build step 28 the percentages share the legend's room under the board; see Scoring and feedback above. Since build step 33 the header has the report a problem flag while the feedback shows; see Other under the site-wide requirements.

## Mode 3: Tactics by piece

The user solves short tactics grouped by the piece that delivers them. The mode is about short tactics with a given piece that end in a capture. This was decided on 12 October 2026, after the full Lichess file was counted. On 15 October 2026 the site's wording stopped calling it winning material, because the last capture does not always come out ahead.

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
- In all pieces the prompt does not name the piece: it reads "Find the best move." In a piece's own category it names it, as in "Find the best knight move." Changed on 15 October 2026 from "Win material in two moves." and "Win material with the knight.", because the last capture does not always come out ahead in material.
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

The user watches a beginner game one move at a time and, after every move, marks every piece and pawn that is hanging. Decided on 13 October 2026, when the hanging phase was taken out of square control. It is numbered after tactics so that earlier references to Mode 3 still hold. The home and progress pages show the modes in the order set on 19 October 2026: spot the hanging piece, square control, tactics by piece, guess the move. See Pages.

**Games**

- The games are the 4,000 practice games of square control, with the same stored answers. Nothing is imported again, and the mode has no import command of its own.
- The user goes through the whole game move by move, starting at move 1. Moves are shown, not guessed, and every move by either side is an exercise.

**The one phase**

- Each move has one phase: mark every hanging piece and pawn on the board, of both sides, judged after the move. A castling move has one phase as well.
- The rules for hanging are those of Mode 2's definitions and Appendix B, step 6: a piece is hanging when the other side can win material by capturing on its square. The captures there are played out, each side taking with its cheapest piece and either side free to stop, and the piece is hanging if the attacking side comes out ahead; an even trade is not hanging. Pieces lined up behind a capturer take part in turn, and a king captures only when nothing else attacks the square. A piece pinned to its own king can capture only along its pin line; other pins are ignored. Kings are left out. The answer is the stored `hanging` set. Pins to the king were counted from 16 October 2026. On 18 October 2026 the exchange replaced the three counting rules used until then.
- A hanging piece is marked again on every move for as long as it stays hanging.
- The piece that just moved can itself be hanging.
- An empty submission is valid. Many positions have no hanging pieces.

**Scoring and feedback**

- The phase scores 1 if the selection is exactly right, and 0 otherwise. Missed pieces and wrongly marked squares both fail it.
- The user sees one running percentage.
- There is one tally for the mode. It is not split by piece: the answer is about the whole board, not about the piece that moved.
- The percentage works as in square control: rounded down, a dash until a phase has been counted, and counted in memory for the visit when storage is unavailable. On the play screen it shares the legend's room as one line, "Hanging 61%". On the landing page it sits between the line and the button, labelled "Hanging pieces". Settled in build step 28.
- Under it, the landing page compares the last seven days with the seven before, in the two small lines "Last 7 days 70%" and "The 7 before 60%", worked out as in square control: the same windows, the same 20-phase minimum with a dash below it, rounded down, and nothing from before the results by day began. Added on 19 October 2026.
- This mode keeps Submit, and does not check a phase as it is marked the way square control does. Nothing moves on just because the marks match the answer, a wrongly marked square is not shown until the phase is submitted, and only a submitted phase is scored.
- Feedback appears after the phase is submitted: missed pieces are highlighted, and wrongly marked squares are shown in a second colour.
- A phase submitted exactly right plays the next move by itself after about 0.6 seconds, the named value square control uses, showing the tick and "Exactly right" first. If anything is missed or wrong, it stops on the feedback and the button continues. Rewind during the pause cancels the move on, pressing the button during the pause moves on at once, and the end of a game stops on "Next game".

**Sessions**

- Sessions are open-ended, and returning resumes at the same move.
- A next game button serves a random game. A game can also be opened by its number, as in square control. The mode opens on a landing page at /hanging that shows the percentage and a Start or Resume button. The exercise itself runs at /hanging/play.
- The session, the seen games and the scores are this mode's own. A game played in square control is not used up here.
- The landing page shows the heading "Spot the hanging piece" and one line under it: "Watch a beginner game move by move, and mark every piece left hanging, on either side." The same line is the page's meta description.
- Everything else about sessions works as in square control: the Start or Resume button, picking an unseen game, the "Next game" button in the header and abandoned games, the silent reset when every game has been seen, and a missing game. Each move has one phase, so resuming always plays the move as usual. Settled in build step 27.
- The landing page has the same three options as square control's, with the same wording, defaults and behaviour: the game in progress with Resume, and the "New game" section with game length, skip the opening and its Start or "Start new game" button. See Choosing the next game under Mode 2. The two choices are this mode's own settings, saved apart from square control's, and the silent reset clears only this mode's seen games of the chosen band. Added on 14 October 2026.
- Games by number work as in square control (see Games by number under Mode 2), with the game's address at /hanging/game/1234, the "Open a game" section after "New game", and the number under the title on the play screen. Added on 18 October 2026.

**The marking screen**

The screen is square control's, with these differences.

- The question is always "Which pieces are hanging, on either side?", so it always says that both sides count.
- The phase indicator has the one tab, Hanging, in the hanging colour. Its square turns into a tick or a cross as in square control.
- The main button reads "Submit · 6 marked" while marking, and "Submit · none marked" when nothing is marked. A marked square is drawn in the hanging colour whether or not it is in the answer.
- After the phase is submitted, the line above reads "Move 2 · Hanging · Not quite" or "… · Exactly right", and the heading says "pieces" where square control says "squares": "One piece missed.", "Both pieces.", "Nothing to mark, and nothing marked.".
- The main button then reads "Next move", or "Next game" after a game's last move.
- Rewind, the move in words, the legend and the board are the same. The board is shown with White at the bottom, and the move's squares are not highlighted.
- Since build step 27 the screen resumes the mode's session, or picks an unseen game, as square control does.

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

**The home page, about, credits and privacy**

Settled in build step 33.

- The modes are shown in this order on the home page and the progress page: spot the hanging piece, square control, tactics by piece, guess the move. Changed on 19 October 2026 from the order decided in build step 33, which was guess the move, tactics by piece, square control, spot the hanging piece. The site leads with what it does that others do not, and spotting the hanging piece is the core skill.
- The home page follows the mockup `home-light`, without its label "Chess training" and its heading "Sit beside the masters and guess their next move.", which were taken out before the step was merged: the header with "Asanfa" and a settings button, then a hairline across the page, the four modes numbered 01 to 04, each with a one-line description, and the footer. The Continue card was on the home page until 19 October 2026. "Asanfa" is the page's main heading. The meta description reads "Free chess training: guess masters' moves, tactics by piece, square control and spotting hanging pieces."
- The Continue card is on the Guess the move page, `/guess`, at the top, above the list of masters. It was moved there from the home page on 19 October 2026, because it only ever showed guess the move. It is text only, without the mockup's strip of board: the label "Continue", the game as "Capablanca vs. Marshall, 1918", White first and by family name, and "Move 9 of 36". The opponent's family name is `opponent_short_name`, as in the play screen's header, and the full name where it is null; the master game response carries it for this. It shows the game in progress that was played most recently, and is left out when no game is in progress or the game no longer exists. The list of masters is hidden until the browser has said whether there is a game in progress, so nothing moves as the page opens. It fetches the game, so it says so while it loads and offers Try again if the request fails.
- The footer has two centred lines: Progress and Settings, as in the mockup, then a smaller line with About, Credits, Privacy and Source code.
- About, at `/about`, is a short plain draft for the owner to edit: a free chess trainer made for friends, what each mode is for, what counts as a hanging piece (added on 16 October 2026, after the hanging rules were widened, and rewritten for the exchange on 18 October 2026), that progress stays in the browser, and that it is free and open source, with a link to the source code.
- Credits, at `/credits`, lists every board, piece set and font from the settings catalogue with its author, licence and source, then Chessground, PGN Mentor for the master games, Lichess for the puzzles and the practice games, and the source code link.
- Privacy, at `/privacy`, says that there are no accounts and no cookies, that progress and settings are kept only in the browser and never sent anywhere, that Cloudflare Web Analytics counts visits without cookies, and that the fonts are served by the site itself.
- About, credits and privacy have the back arrow to the home page, as the progress page does.

**Back from a play screen**

Settled in build step 33.

- The back arrow on the four play screens (a master game, tactics, square control and spot the hanging piece) returns to the page the user came from, as the browser's own back button does. A game opened from the Continue card goes back to the Guess the move page; one opened from a game list goes back to the list as it was left, with its page, search and filters.
- When there is no page on the site to return to, because the screen was opened from a shared link, a bookmark or a fresh launch of the installed app, the arrow goes to the screen's parent page: the master's game list, the tactics categories, or the mode's landing page. The parent page takes the screen's place in the browser history, so the browser's back button then leaves the site rather than returning to the screen.
- The site knows a page is behind the current one by keeping the pages the tab has shown since the site was loaded. A reload starts afresh, so after a reload the arrow goes to the parent page.

**Settings**

- Appearance: light, dark, or match the device
- Board theme and piece set, taken from Lichess's collection, starting with three or four of each. The default board is Lichess's olive board and the default piece set is Lichess's Maestro
- Sound on or off. Switched off for now, until original sounds are chosen: see the settings page below
- Move input: tap, drag, or both
- Opponent move delay in guess the move: 1 to 5 seconds in whole seconds, default 3. It is set with a slider that moves in whole seconds and shows the chosen value, such as "3 s", both on the play screen and in settings
- Marking colours for square control and spot the hanging piece, including at least one colour-blind-friendly palette

**The settings page**

Settled in build step 31.

- The page is at `/settings`. Its title is "Settings", its heading "Settings", and its meta description "Choose the look of the board and pieces, move input and marking colours. Saved only in this browser." The home page links to it.
- Its sections, in order: Appearance, Board, Pieces, Marking colours, Sound, Moves (move input and the opponent's reply delay), and the reset progress button at the foot, the same component as on the progress page. The Sound section is hidden while sound is switched off.
- Every setting takes effect at once, on the settings page and on every board, and is saved straight away, so it survives a reload. If storage is unavailable, the settings still apply for the visit, and the page shows the notice that progress will not be saved.

| Setting | Choices | Default | Where it applies |
| --- | --- | --- | --- |
| Appearance | Light, Dark, Match device | Match device | Every page |
| Board | Olive, Brown, Blue, Green | Olive | Every board |
| Pieces | Maestro, Fantasy, Merida, Cardinal | Maestro | Every board, and the promotion picker |
| Marking colours | Standard, Colour-blind friendly | Standard | The board, phase tabs and legend of square control and spot the hanging piece |
| Sound | Off, On | Off | Every board, while sound is switched on in the code |
| Move input | Tap, Drag, Both | Both | The boards where a move is made: guess the move and tactics. Marking is always by tap |
| Opponent's reply delay | 1 to 5 seconds | 3 | Guess the move |

- The board and the pieces are chosen from small previews: a corner of each board, and each piece set on the chosen board.
- The reply delay slider on the guess the move play screen is the same setting. Both sliders change it as they move and save it when they are let go, so there is one value.
- Sound plays when a move is played on the board, in all four modes: a capture sound for a capture, a move sound for any other move. A new position that does not follow from the one before by a single legal move, such as stepping back through a game or the correction after a wrong guess, makes no sound.
- Sound is switched off until original sounds are chosen. Enigmahack's sfx sounds from Lichess were used at first and have been removed, with their licence notice and their credit. The code that plays sound stays: the sound player, the call in the board component and the single-legal-move check. One flag, `SOUND_ENABLED` in `resources/js/settings/sound.ts`, is false, so nothing loads or plays and the Sound section is hidden. The `sound` setting is still read and saved, so a value saved earlier loads without error.
- To turn sound back on: put the two files in a folder under `resources/sounds/`, named `Move` and `Capture`, as `.ogg`, `.mp3` or both, with a `LICENSE.md` beside them naming the author and licence; add the set and its credit to `resources/js/settings/catalogue.ts`, the source for the credits page; and set `SOUND_ENABLED` to true. The player finds the files by name, and the Sound section reappears.
- A saved board, piece set or palette that is no longer offered falls back to its default.
- Every default is set in one place in the code, the storage module's list of defaults, and every reader of the settings uses it.

**Progress**

- All progress, history and settings are stored in the browser using IndexedDB, in a versioned format so they can be uploaded to an account later.
- The one exception is a copy of the appearance setting in localStorage, so that a small script in the page head can apply it before anything is drawn and a reload does not flash the wrong mode. IndexedDB stays the real store; the copy is written when the setting is saved there, and refreshed whenever the settings are read. Settled in build step 31.
- Clearing browser data or switching devices loses progress. This is accepted for the MVP.
- Safari erases a site's stored data after seven days without a visit. Installing the site to the home screen avoids this, and the progress page explains how.

**The progress page**

Settled in build step 30.

- The page is at `/progress`. Its title is "Progress", its heading "Your progress", and its meta description "Your scores in the four modes, kept only in this browser." The home page links to it.
- It shows the four modes in the order of the home page, changed on 19 October 2026 (see Pages): spot the hanging piece, square control, tactics by piece, guess the move.
- Guess the move lists accuracy by master as described under its scoring. The percentage is rounded down, like the marking percentages. Masters with the same accuracy are listed with more moves first, then in the fixed master order. With no finished game the section shows one line: "No finished games yet."
- Square control shows its two percentages, "Squares lost" and "Squares controlled", and spot the hanging piece its one, "Hanging pieces", as on their landing pages: rounded down, with a dash until something is counted. The tallies by piece of square control are not shown.
- Under each of these three percentages are the same two lines as on the landing pages, "Last 7 days 70%" and "The 7 before 60%", with the same rules. Added on 19 October 2026.
- Tactics shows solved out of attempted, as "14 / 20": an "All pieces" total row first, as on the category page, then the six pieces in their order. A row shows a dash before any attempt.
- The Safari note reads "Safari deletes a site's saved data after seven days without a visit. Visiting at least once a week keeps your progress." It is shown only in Safari, on any device.
- The install note is not shown at all until the iPhone test answers the carry-over question and the note is worded. Step 32 showed a placeholder, "[Install note]"; step 33 took it out. Once worded, the note is not shown when the site is already installed.
- If storage is unavailable, the page shows the notice that progress will not be saved, and the marking modes' figures show what was counted during the visit.
- The reset progress button sits at the foot of the page. It is shown whenever there is something to clear, stored or counted in memory during the visit, and hidden otherwise. It opens the slide-up panel with the heading "Reset all progress?", the text "This clears your scores, history and saved games in every mode, in this browser. Your settings stay. This cannot be undone." and two buttons, "Reset progress", marked as destructive, and "Cancel". After a reset the page shows its empty state and the line "Progress reset."

**Name and installing**

Settled in build step 32.

- The site is called Asanfa Chess Trainer, Asanfa for short. Page titles and the share summary use the full name. The home page header shows "Asanfa" in the small italic serif title, where the mockups have "[Site name]".
- The icon is a cream pawn on the accent green, an original design made for this project that needs no credit. Its two SVG sources are in `public/icons/`: `favicon.svg`, with rounded corners, and `app-icon.svg`, full-bleed with the pawn at 80% so it stays inside the maskable safe zone.
- The favicon is the SVG, with a 32-pixel PNG fallback. The manifest icons (192 and 512 pixels, the 512 one listed a second time as maskable) and the 180-pixel Apple touch icon are opaque PNGs made from the app icon, in the same folder.
- The manifest is `public/manifest.webmanifest`: the name and short name above, `display: standalone`, and the page background token as its theme and background colour, light mode's in the manifest and both modes' in the page head, so the browser's own bar matches the page. When the appearance is set to light or dark rather than matching the device, the page head follows that setting.
- There is no service worker and nothing works offline. Browsers no longer need one to install a site.

**Other**

- A reset progress button, with a confirmation step. It is on the progress page from build step 30, and the same component goes into settings as well in step 31, so it lives in both. Settled in build step 30.
- When a game or puzzle fails to load, the user sees a clear message and a retry button.
- Every exercise has a report a problem link that opens a GitHub issue pre-filled with the game or puzzle and the move number. The link is shown only once there is something to report, so it never gets in the way while playing: at the end of a master game and in its review, after a puzzle is solved or failed, and in square control and spot the hanging piece with the feedback for each move. Decided on 12 October 2026.
- The link is a flag button, 44 pixels square and labelled "Report a problem", at the right of the play screen's header, so the screen keeps its height: in guess the move in the slot at the right, in tactics before Auto next, and in the two marking modes before Next game. It opens a new GitHub issue in a new tab, with a title and a body naming the mode, the game or puzzle, and the move. A master game gives its link and the move shown, or the end of the game; a puzzle gives its ID, piece and rating, and its Lichess link; a practice game gives its ID, the move in words and the phase. Settled in build step 33.
- Every page that fetches data says so while it loads, and if the request fails it says what did not load and offers Try again. These are the three play screens and the Continue card on the Guess the move page. Settled in build step 33; the card was on the home page until 19 October 2026.
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
- Every board looks the same in light and dark mode for now. No board is dimmed or swapped in dark mode. Settled for olive at first, and for every board in build step 31.
- The marking colours of square control and spot the hanging piece must be clear in both modes and on every board theme.
- One or two typefaces, with care for numbers, since scores and tallies appear everywhere.
- Motion is quick and subtle.

**Chosen direction: Study**

- Headings are set in Newsreader, a serif. Body text and controls are set in Instrument Sans. Both font files are served from the site's own server, not from Google, so no visitor request goes to a third party; their licences are checked when the files are downloaded. Both are under the SIL Open Font License 1.1, with each `OFL.txt` beside the files in `resources/fonts/`. They are listed in the settings catalogue and credited on the credits page since build step 33.
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

The four board rows in this table describe the sage board drawn in the mockups, which is no longer the default, so they are not tokens. Every board is the same in both modes, so everything drawn on the board uses the light-mode values in both modes, on every board: the last-move highlight, the marks and the feedback. These are separate "on the board" tokens. The "on the page" versions of the same colours, used for things like the phase indicator, still change with the mode. Outline buttons take their border from one more token, `#C3BBAB` in light mode and `#4A473F` in dark.

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

**Marking palettes**

Settled in build step 31. The colours above are the standard palette. A palette sets every marking colour: the three phases, and correct, missed and wrong, on the board and on the page (the phase tabs and the legend). Missed keeps the correct colour, dashed, in both palettes.

The colour-blind friendly palette follows Okabe and Ito. With red-green colour blindness the standard amber and red are hard to tell apart, and in square control a wrong square appears in red while the lost squares are marked in amber, so this palette keeps wrong apart from lost by lightness as well as hue: lost is a light orange and wrong a very dark red.

| Colour | On the board | On the page, light | On the page, dark |
| --- | --- | --- | --- |
| Lost | `#E69F00` | `#B37700` | `#E69F00` |
| Controls | `#0072B2` | `#0072B2` | `#56B4E9` |
| Hanging | `#7B3294` | `#7B3294` | `#C38AD6` |
| Correct and missed | `#0072B2` | `#0072B2` | `#56B4E9` |
| Wrong, and its text | `#5C0A0A` | `#5C0A0A` | `#F2C4C4` |

- On the board, the marked square's border is the fill mixed with 50% black, as in the standard palette, and so is the wrong square's border.
- Both palettes were checked on all four boards, on their light and dark squares, under normal vision and simulated protan, deutan and tritan vision. In the colour-blind palette the smallest colour difference (CIEDE2000) between wrong and lost, controls or correct is 23, against 6 for the standard palette's lost and wrong under deutan vision. On the page, the wrong text passes 4.5 to 1 in both modes. The check was run again when the green board replaced maple: on green the closest pair is the colour-blind lost and wrong under tritan vision, at 23, and every mark stays at least 9 apart from the bare green squares.
- Reset progress uses its own destructive colour, which the palettes do not change.
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
- Installable: the site can be added to the phone's home screen. There is no install prompt on the first visit; the option is mentioned only on the progress page. See Name and installing above.
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
- Golden tests for the control and hanging-piece rules: fifty-one hand-verified positions covering every definition and consequence listed under square control. These are written before the import code, because errors there store wrong answers without any visible failure.
- Import twice and confirm every game and puzzle keeps the same ID.
- Replay short made-up games that include castling on both sides, a promotion and an en passant capture, and confirm they replay correctly. The games are made up because imported game data is never committed.
- Extract made-up games with one of them on the exclusion list, and confirm it is skipped and reported.
- Extract made-up puzzle rows with hand-written positions, and confirm each rule: four moves only, the same piece on both solver moves, no puzzle ending in checkmate, a capture on the last move with en passant counted, a promoting pawn filed under pawn, castling filed under king, an illegal move rejected, and the same per-piece cut on every run.
- Play made-up puzzles through the tactics play logic, and confirm each rule: a correct first and second move solves the puzzle; a wrong first move fails it and the retry starts from the same position; a wrong second move after a correct first move fails it; a later correct answer still leaves it failed; show solution plays only the missed move, and the arrows then reach every position from the setup to the end; redo resets the board but keeps the result; auto next moves on only after a solve, and anything pressed during the pause cancels it; and a promotion move counts the promotion piece.
- Choose puzzles from made-up ID lists, and confirm each rule: easiest first with equal ratings by ID; seen puzzles left out; all pieces as one list across the pieces; an empty pool when everything is seen; a puzzle seen in its piece's category left out of all pieces; and clearing one piece leaves the others' seen records alone.
- Extract made-up practice games, and confirm each rule: a missing rating, an abandoned game, a rules infraction, another time control, a player at the rating limit, a bot player, a game that is too short or too long and an illegal move are each skipped and reported; no player name reaches the output; the family cap and the length bands hold; and the same games are chosen in the same order on every run.
- Load made-up practice games where one has an answer list holding something that is not a square, and confirm the line is rejected and nothing is written.
- Work through made-up practice games in the square-control phase logic, and confirm each rule: squares are marked and unmarked; marks that exactly match the answer, with at least one square marked, end the phase at once as correct; a wrong square is shown at once and fails the phase, even when it is unmarked and the set is then completed, which counts as corrected and not as exactly right; an empty answer is only confirmed with the button, which reads "Nothing" with no square marked and "Show me" otherwise; pressing the button ends the phase, and a missed square fails it; every phase is scored exactly once; a phase that has ended cannot be changed; an ordinary move has two phases and a castling move four, each with its own piece and answer; the next move plays after the last phase of a move; the game is finished after the last phase of the last move; and rewind keeps the marks and switches off when a phase ends and on a new move.
- Work through the same made-up games in spot the hanging piece, and confirm each rule: every move has one phase, castling as well; a hanging piece of either side is in the answer; marking nothing is right when nothing hangs; the next move plays after each phase; and the game is finished after the last move.
- In both marking modes, confirm moving on by itself: a phase that is exactly right moves on after the pause and not before, to the next phase or the next move; a phase ended with a square missed or wrong never does; in square control a set completed after a wrong square moves on as corrected although the phase failed, and a "Nothing" that is right moves on as well; in spot the hanging piece marks that match the answer do nothing until they are submitted, and a wrong square is not shown before then; rewind during the pause cancels it for good; the button during the pause moves on at once and only once; and the end of a game waits for the button.
- Choose practice games from made-up ID lists, and confirm each rule: only games unseen in that mode are chosen; the current game is never chosen again; a game seen in one mode is still chosen in the other; and when a mode runs out, only that mode's seen games are reset.
- Choose practice games by length from a made-up list, and confirm each rule: only games of the chosen band are chosen, including the games at each band's edge; when a band runs out, only that band's seen games are reset, the current game is still avoided, and the other bands keep theirs; and a band with no games has nothing to choose. Added on 14 October 2026.
- Start made-up practice games after a skipped opening, and confirm each rule: the game starts at White's move after the skipped full moves, at move 1 with nothing skipped, and at the last move of a game too short for the skip; the starting position is the one after the skipped moves, with a castling move and a capture among them; and only the moves worked on are counted. Added on 14 October 2026.
- Resume made-up practice games in the marking logic at a saved move and phase, and confirm each rule: it starts at that move and phase; a first phase plays the move after the starting position, and a later phase shows the position after the move at once; a castling move resumes at the rook's lost and controlled phases; and the saved results of the move's earlier phases are shown and counted as they were. Both tests added in build step 27.
- Open made-up practice games by number in both marking modes, and confirm each rule: with no game in progress the game starts at move 1, with the skipped opening left out; another game in progress is left as abandoned; the game in progress resumes where it stands; a finished game, which a random pick no longer serves, is played again from move 1; and a number not in the game list, or not a number, names no game, and the game's address is the not-found page. Added on 18 October 2026.
- Request the two practice-game endpoints with made-up games, and confirm each rule: the ID list in ID order, and empty when nothing is loaded; a game with its moves and answers and no field the screen does not use; the cache header, no cookie and no CORS header; a 404 for an unknown ID and for an ID that is not a whole number, with no public cache header; and the rate limit.
- Resize the board with a made-up settings store, and confirm each rule: the size is saved once when the resize ends and not during the drag; it is still there for the next puzzle without the settings being read again; a saved size is used on the next visit; and a resize made before the settings arrive is not overwritten by them.
- Open the four play screens in a headless browser with made-up games and puzzles, at 360×640, 375×550, 390×660 and 412×780, and confirm in each state (playing, after a wrong guess, looking back at a move, the end of a game, a failed puzzle with Show solution, the solution shown, a wrong square shown in square control, the feedback and rewind of both marking modes) that the page does not scroll in either direction, that the board is the full width at 360×640, 390×660 and 412×780, and that it is at least 280 pixels at 375×550.
- Compare made-up results by day in the two windows, and confirm each rule: a day at the first and at the last date of each window counts in it, a day just before the earlier window or after today counts in neither, and the windows count calendar days across a month end; and a window's percentage shows only from 20 phases, rounded down, with a dash below that. Added on 19 October 2026.
- Record made-up marking phases in a stand-in for the browser's database, and confirm each rule: a phase's running tally and its daily record are saved together, and when a write in the same transaction fails, neither is; reset progress clears the daily records; upgrading a version 2 database with progress in it keeps that progress unchanged and adds the empty store; and without storage the visit's phases are counted by day in memory, and reset clears them too. Added on 19 October 2026, with `fake-indexeddb` (Apache-2.0) as the stand-in, a development dependency only.
- Read a small file packed in several zstd frames, and confirm it gives exactly the same lines as the same file in one frame, including a line that spans a frame boundary.

**Operations**

- Production runs with debug mode off.
- Production's resource use is capped, decided on 14 October 2026: memory limits of 768 MB for the app container and 512 MB for Postgres, with no swap on top, in `compose.production.yaml`, and at most 16 Apache workers (`MaxRequestWorkers` and `ServerLimit` 16) in `deploy/docker/apache-server.conf`. The app shares a server with other sites, so a traffic spike must not use up the server's memory. Sixteen workers handle far more than the site needs, since most of the work runs in the browser and the server only hands out pages and data. `docs/deployment.md` says how to see the usage and where to raise the limits.
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
- The assets offered in build step 31, each copied unchanged from Lichess's source code into its own folder with its own licence notice. The settings catalogue in the code lists each one with its author and licence, and is the one source for the credits page.

| Asset | Author | Licence |
| --- | --- | --- |
| Boards: olive, brown, blue, green | The lila authors and pirouetti | AGPL-3.0 or later |
| Pieces: Maestro | sadsnake1 | CC BY-NC-SA 4.0 |
| Pieces: Fantasy | Maurizio Monge | MIT, with the copyright notice and licence text in its folder |
| Pieces: Merida | Armando Hernandez Marroquin | GPL-2.0 or later |
| Pieces: Cardinal | sadsnake1 | CC BY-NC-SA 4.0 |

- After build step 31, Cardinal replaced the Chessnut piece set and the green board replaced the maple board. The Chessnut and maple files were removed. A saved choice of Chessnut or maple falls back to the default, Maestro or olive.
- Later, Fantasy replaced the Cburnett piece set, and the Cburnett files and their GPL notice were removed. A saved choice of Cburnett falls back to Maestro, which stays the default. Fantasy is under the MIT licence, which requires its copyright notice and licence text to ship with the files, so `LICENSE.txt` from Maurizio Monge's repository is kept in its folder.
- Cardinal, like Maestro, is non-commercial and share-alike (CC BY-NC-SA 4.0). While either is offered, the site must stay free, with no commercial use, and their SVG files must be used unmodified.
- No sounds are shipped. Enigmahack's sfx Move and Capture sounds (AGPL-3.0 or later, from Lichess) were offered in build step 31 and later removed, with their licence notice and credit, until original sounds are chosen. Any sounds added later go in their own folder with their own licence notice, and are credited in the settings catalogue.
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

The steps follow their numbers, except that deployment waits until the build is done. Decided on 14 October 2026. After step 31 the order is:

1. Step 32, installable.
2. Step 33, the remaining pages and states. After it, on 14 October 2026, the game length, skip the opening and start a new game options were added to the two marking modes' landing pages, outside the numbered steps.
3. Step 4, the first deployment, to `chess.asanfa.com`. Done on 15 October 2026.
4. The full imports on the server: the master games loaded locally in step 18, and steps 23 and 29. Done by 16 October 2026. The intermediate files reach the server by `scp` or through Hestia's file manager, as `docs/deployment.md` describes.
5. The iPhone carry-over test, listed in Stage 6.
6. Step 34, the launch check.

**Stage 1: Foundation**

| Step | Build | Done when |
| --- | --- | --- |
| 1. Repository | The starter kit with Vue, Inertia and TypeScript, with its login and registration pages removed; Docker for PHP, Node and Postgres; the GPL-3.0 licence file; a public GitHub repository with secret scanning | The home page loads in Docker from a fresh clone |
| 2. Check command and CI | Pint, Larastan, Rector, Pest architecture tests, the TypeScript checker, ESLint, Vitest and the licence check, behind one command; CI and a pre-commit hook that run it | CI passes on the empty app and fails on a deliberate violation of each tool |
| 3. Agent setup | This document saved as `docs/requirements.md`; `AGENTS.md` written from Appendix H; Laravel Boost installed | An agent given a trivial task reads both files and runs the check command |
| 4. First deployment | Done on 15 October 2026, after step 33. Settled on 14 October 2026; the runbook is `docs/deployment.md`. The owner's Hetzner server runs Ubuntu 24.04 managed by HestiaCP 1.10.2, whose nginx, in front of Apache, serves other sites, so nothing else on it changes: Docker from Docker's apt repository runs the app (Apache with PHP 8.4 and the built assets, `Dockerfile.production`) and Postgres 18 (no published port, data in a named volume) from `compose.production.yaml`, with the app published on `127.0.0.1:8012` only; secrets in a server-only `.env`; debug mode off. Hestia's nginx proxies `chess.asanfa.com` to it through the custom proxy template `asanfa` (`deploy/hestia/`), keeping Hestia's Let's Encrypt certificate and renewal. Cloudflare is in front, proxied, with Full (strict) encryption for the subdomain. Laravel trusts only the gateway of the app's fixed Docker network, and only its `X-Forwarded-For` and `X-Forwarded-Proto`; visitors' real addresses come from Hestia's nginx, which takes them from Cloudflare's `CF-Connecting-IP` through its `cloudflare.inc`. A Hestia firewall reload rebuilds only the `INPUT` chain and leaves Docker's rules alone, so no firewall hook is needed. A nightly `pg_dump` to `chess-trainer-backups` in the Hestia user's home, keeping the last 14, and before every deploy. `deploy/deploy.sh`, run by hand on the server, pulls `main`, builds, backs up, migrates and swaps the container. Automatic deploys on merge are a follow-up | The site answers on `https://chess.asanfa.com`, deployed from the main branch by `deploy/deploy.sh`, and a firewall reload in the Hestia panel leaves it running |

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
| 18. Full import | All master games loaded. Done on 12 October 2026 into the local database: 5,772 games. Loaded on the server by 16 October 2026, after step 4 | Needs no further decisions: the game source and the minimum length are settled |

**Stage 4: Tactics by piece**

| Step | Build | Done when |
| --- | --- | --- |
| 19. Table and import | The `puzzles` migration; `extract:puzzles` and `import:puzzles`, run on the full Lichess file. Done on 12 October 2026 into the local database: 12,000 puzzles | The puzzles load, every puzzle obeys the same-piece rule, and a second run adds nothing |
| 20. Endpoints | The puzzle ID list and the fetch-by-IDs endpoint | Both match Appendix F |
| 21. Play screen | The setup move, the first move, the opponent's reply and the second move, fail then retry, and show solution | A puzzle can be solved and failed on a phone |
| 22. Categories and progress | The category page with the all pieces option; the easiest-first order; seen tracking; tallies; the reset when a category runs out | No puzzle repeats within a category until it is exhausted |
| 23. Full import | Done by 16 October 2026: all 12,000 puzzles loaded on the server, from the same intermediate file loaded locally in step 19 (`data/intermediate/puzzles.jsonl`, kept safe outside the repository), so the selection does not change. Refreshing from a newer Lichess file is not planned: imports never delete, so each refresh would add puzzles without removing any | Needs no further decisions: puzzle difficulty is settled |

**Stage 5: Square control and spot the hanging piece**

| Step | Build | Done when |
| --- | --- | --- |
| 24. Table and import on a sample | The `practice_games` migration; `extract:practice` with the calculation from step 7; `import:practice-games`. Done on 13 October 2026 into the local database: 500 games, from the first 1.5 GB of the September 2026 file | The sample loads, and neither the intermediate file nor the database holds a username |
| 25. Answer viewer | A development-only page at `/dev/answers` that steps through an imported game and shows the stored answers on the board and as lists: three for an ordinary move, five for castling | You have checked several games by eye and found no wrong answer |
| 26. Marking screen | The three phases on one game: tap to mark, submit, feedback showing missed and wrong squares, and the rewind button. Nothing is saved yet. After the step, on 13 October 2026, the screen was split into the two modes: two phases in square control, one in spot the hanging piece, and moving on by itself after a phase that is exactly right | A full game can be worked through comfortably on a phone |
| 27. Session | For both modes, each with its own progress: next game; resuming at the exact move and phase; seen games | Closing and reopening the browser resumes at the same phase in each mode, and a game finished in one mode is still served in the other |
| 28. Tallies | For square control, the two phase scores and the tallies by piece; for spot the hanging piece, its one score | The numbers match a session counted by hand |
| 29. Full import | Done by 16 October 2026: all practice games loaded on the server, from the same intermediate file loaded locally in step 24 (`data/intermediate/practice-games.jsonl`, kept safe outside the repository), so the 500 games do not change. On 17 October 2026 their answers were brought up to answers version 4 with the update option, keeping every ID. On 18 October 2026 the practice games were grown from 500 to 4,000 (`--limit 4000 --per-family 200`) from the same source file, keeping every ID: the first 500 are among the 4,000, and the new games follow on from them | Needs no further decisions: game selection is settled |

**Stage 6: Finish**

| Step | Build | Done when |
| --- | --- | --- |
| 30. Progress page | Stats for the four modes, the install note, the Safari note, and reset progress | The page matches what was played, and reset clears it |
| 31. Settings | Board themes, piece sets, sound, move input, opponent delay, and marking palettes | Each setting takes effect at once and survives a reload |
| 32. Installable | The web app manifest and icons; the site name in the page header; the install note on the progress page as a placeholder, not shown when the site is already installed | The site installs from the desktop browser or a local network address and opens without the address bar |
| 33. Remaining pages and states | The home page with the four modes, in the order decided in this step (see Pages); about, credits, privacy, the report a problem links, and loading and failure states | Every page exists, and a failed load shows a retry button |
| iPhone test | Done after the full imports on the server. Whether progress made in Safari carries over to the site installed on an iPhone's home screen, tested on a real phone; the install note on the progress page worded from the answer | The carry-over question is answered, and the install note says what the test found |
| 34. Launch check | Licences and credits; the Cloudflare cache rule, strict encryption, Rocket Loader off, and the server firewall; analytics; error tracking; a test restore of a backup | Every item is confirmed on the live site |

## Open decisions and later features

One decision is still open: whether progress carries over after installing on an iPhone, which the iPhone test answers. The source of master games, their minimum length, puzzle difficulty, the selection of practice games, and the name and domain are settled.

**Open decisions**

| Decision | Applies to | What needs deciding |
| --- | --- | --- |
| Game selection | Square control | Decided on 13 October 2026, after a report on the first 4.9 million games of the September 2026 file: 500 games with the time control `600+0`, both players under 1200, no bot players, 30 to 120 plies, at most 25 per opening family, spread evenly over three length bands. On 18 October 2026 grown to 4,000 games with at most 200 per opening family, by the same rules and from the same file, so the first 500 stay. Appendix E has the exact rule |
| Puzzle difficulty | Tactics by piece | Decided on 12 October 2026: a rating of at most 1500, a popularity of at least 80, at least 500 plays, and 2,000 per piece, taking the most popular, then the most played, then by puzzle ID. Puzzles are served easiest first within a category |
| Minimum game length | Guess the move | Decided on 11 October 2026 that there is no minimum; changed on 12 October 2026 to two plies, after the full extract turned up eight games forfeited after one move |
| Source of master games | Guess the move | Decided on 11 October 2026: PGN Mentor's free per-player files, one per master. The site states no licence beyond "completely free", so only moves and basic details are imported, annotations are stripped, and PGN Mentor is credited on the credits page |
| Progress after installing on iPhone | Whole site | Whether progress made in Safari carries over to the installed version; needs a test on a real phone, the iPhone test in the build order |
| Name and domain | Whole site | Decided on 14 October 2026: the site is called Asanfa Chess Trainer, Asanfa for short, and lives on a subdomain of a domain the owner already has, given at the first deployment: `chess.asanfa.com` |

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
- A full game browser for the practice games, with length filters; not planned yet
- A weekly chart on the progress page of the marking modes' percentages, for example over the last 12 weeks, drawn from the results by day in Appendix G

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

The colour of a piece standing on an attacked square does not matter. A piece's own square is never in its attack set. Pins, checks and whose turn it is are ignored: the attack sets, and so `lost` and `controlled`, never depend on them. Only the hanging exchange in step 6 takes pins to the king into account.

**Steps for one move**

Call the position before the move B and the position after it A.

1. Before set: the attack set of the moving piece on its start square, in B.
2. After set: the attack set of the piece now on the destination square, in A. For a promotion this is the new piece.
3. `lost` is the before set minus the after set.
4. `controlled` is the after set.
5. Castling: do steps 1 to 4 separately for the king and for the rook. `lost` and `controlled` are the king's alone. The rook's two sets are stored apart, as `rook.lost` and `rook.controlled`. On every other move `rook` is null.
6. `hanging`: look at every piece and pawn P in A, of both colours, except the kings. P is hanging if the other side can win material by capturing on P's square. This is worked out by an exchange on that square, in A:
    1. The attacking side, the colour other than P's, captures first, then the sides take turns recapturing on the square. Each side always captures with its cheapest piece that can capture there at that moment. Whose turn it is in A does not matter.
    2. Either side may stop at any point instead of capturing, and does so when continuing would leave it worse off. The attacking side may also choose not to start at all.
    3. P is hanging if the best result for the attacking side is a gain of more than 0. An even trade, for example a knight for a knight, is not hanging.
    4. The values are pawn 1, knight 3, bishop 3, rook 5 and queen 9. A knight and a bishop are equal.
    5. Kings: a king can capture only if, after its capture, no piece of the other side still attacks the square, counting the pieces that have become available (point 6) and pinned pieces next to it (point 7). The king's capture always ends the exchange. So a king always captures last, and it can never take a piece that is still defended.
    6. Batteries: pieces lined up behind a capturer take part in turn. The capturers are first the pieces whose attack set, as above, holds the square. Behind such a front piece, on the line running away from the square, the next piece joins in if it is of the same colour and moves along that line: a rook or queen on a rank or file, a bishop or queen on a diagonal. The front piece can be a rook, bishop or queen, or a pawn, and then only a bishop or queen behind it on the pawn's capture diagonal counts. Chains continue, for example rook, rook, queen. A piece behind becomes available only once every piece in front of it on that line has captured. Nothing behind a king or a knight counts, and a piece of the other colour ends the line. Batteries count on both sides.
    7. Pins: a piece is pinned when it stands on a rank, file or diagonal between its own king and an enemy rook or queen (on a rank or file) or an enemy bishop or queen (on a diagonal), with no other piece between the king and that enemy piece. Its pin line is the squares between the king and the pinning piece, plus the pinning piece's own square. A pinned piece can capture only if the square is on its pin line, which includes taking the pinning piece. A pinned piece off its line cannot capture, but it still attacks the square, so it stops the other side's king from capturing there. Pins of both colours count, whoever is to move. Pins to the queen or any other piece are ignored. Pins are worked out once, in A, and not again during the exchange.
    8. Simplifications: en passant is not part of the exchange, and a pawn that captures onto the last rank keeps the value of a pawn.

    This rule dates from 18 October 2026. It replaced three counting rules, used from 16 October 2026: attacked and not defended; attacked by a cheaper piece; and two or more attackers and one defender, with conditions. They were replaced because they kept missing or wrongly marking exchanges: they did not see pieces lined up behind each other, and could not tell an exchange that wins from one that does not. Pins to the king were counted from 16 October 2026.

    For example:

    - A piece with an attacker and no defender is hanging, and so is a piece attacked by a cheaper one: a queen attacked by a knight and defended by a pawn is hanging, because knight takes queen and pawn takes knight wins 6.
    - An even trade is not hanging: a bishop attacked by a knight and defended by a pawn, or a knight attacked by a knight and defended by a pawn.
    - A knight attacked by a knight and a bishop and defended by a rook and a queen is hanging: knight takes knight, rook takes knight, bishop takes rook and queen takes bishop wins 8 for 6. A pawn attacked by a knight and a bishop and defended by a knight and a bishop is not, because knight takes pawn and knight takes knight already loses 2, and going on does not help.
    - A rook attacked by a rook and a queen and defended only by a pawn is hanging: rook takes rook, pawn takes rook and queen takes pawn. A knight attacked by a rook and a queen and defended only by a bishop is hanging too: rook takes knight, bishop takes rook and queen takes bishop wins 6 for 5.
    - Batteries: a rook defended only by a queen and attacked by two rooks doubled on the file is hanging: rook takes rook, queen takes rook and rook takes queen. A pawn on d5 defended by a pawn on c6 and attacked by a pawn on e4, with a queen behind it on f3, is hanging: exd5, cxd5 and Qxd5 wins a pawn. A piece lined up behind a defender counts in the same way: a knight attacked by two knights and defended by a bishop with a queen behind it is not hanging.
    - Kings: a pawn defended only by its king and attacked by one rook is not hanging, because rook takes pawn and king takes rook. With a second rook doubled behind the first it is hanging, because the king cannot take back.
    - Pins: with a white king on e1, a white bishop on e2 pinned by a black rook on e8, a white queen on g1 and a black king on h5, a black pawn on g4 is hanging: queen takes pawn, and the king cannot take back because the bishop covers g4, though the bishop itself cannot capture there. With a white king on e1, a white knight on c3 and a black bishop on b4, the knight cannot capture on e4, so a white pawn there attacked by a black knight and defended by nothing else is hanging.
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

**Example: hanging pieces in a practice game**

From a practice game, after 1.e3 d5 2.Qh5 Nc6 3.c4 dxc4 4.Bxc4 Nh6 5.g4 Ne5 6.g5 Nc6:

- The knight on `h6` is attacked by the g5 pawn and the queen, and defended by the g7 pawn, with the bishop on f8 behind that pawn. gxh6 gxh6 wins White a knight for a pawn, and Qxh6 would lose the queen to the bishop, so the knight is hanging.
- `f7` is attacked by the bishop and the queen and defended by the king and the knight on h6. Bxf7 Nxf7 Qxf7 Kxf7 leaves White behind, so it is not hanging.

White then plays 7.gxh6:

- `f7` is now defended only by the king. Bxf7 wins a pawn, and the king cannot take back while the queen covers f7, so it is hanging.
- The pawn on `h6` is attacked by the g7 pawn and defended by the queen. gxh6 wins it, because Qxh6 would lose the queen to the bishop on f8, so it is hanging.

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
| `opponent_short_name` | text | Nullable; the family name, taken from the part of the source name before the comma, for titles, the play screen header and, since build step 33, the Continue card (on the home page until 19 October 2026, now on the Guess the move page), which reads it from the master game response. Added in build step 17; where it is null, the full name is shown |
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
| `answers_version` | smallint | The version of the calculation in Appendix B that produced the answers. It started at 1. It became 2 on 13 October 2026, when the rook's answers on a castling move were stored apart from the king's, became 3 on 16 October 2026, when rules 2 and 3 were added to `hanging`, became 4 later that day, when rule 2 was widened from a pawn attacker to any cheaper attacker and pins to the king were counted for `hanging`, became 5 on 18 October 2026, when rule 3 of `hanging` was changed to need an attacker worth no more than the piece, or the king as the one defender, and has been 6 since later that day, when the three rules of `hanging` were replaced by an exchange on each square, because the counting rules kept missing or wrongly marking exchanges |
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
| `extract:practice` | `--limit` | How many games are chosen | 4000. Decided on 13 October 2026 as 500, raised to 4000 on 18 October 2026 |
| `extract:practice` | `--per-family` | Most games chosen per opening family | 200. Decided on 13 October 2026 as 25, raised to 200 on 18 October 2026 |
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
- There are three length bands: short, up to 49 plies; medium, 50 to 73 plies; and long, 74 plies or more. With the default limits these are 30 to 49, 50 to 73 and 74 to 120. Since 14 October 2026 the same bands are the game length choice of the two marking modes, so they are defined once, in `resources/js/marking/lengths.ts`, which the extract uses.
- Each band takes a third of `--limit`. When the limit does not divide by three, the shorter bands take the remainder, so 4,000 gives 1,334, 1,333 and 1,333.
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
| `/guess` | The masters, with the Continue card above them when a game is in progress |
| `/guess/{master}` | Game list for one master, by slug |
| `/guess/{master}/random` | Redirects to a random game by that master |
| `/guess/{master}/{game}` | Play a master game |
| `/squares` | Square control landing page: the two phase percentages (from step 28), each with the last seven days against the seven before (from 19 October 2026), the game in progress with Resume, if there is one, a New game section with the game length and skip the opening choices and a Start or Start new game button, and an Open a game section that opens a game by its number |
| `/squares/play` | The square-control exercise |
| `/squares/game/{game}` | One practice game in square control, by its number; `game` is digits only, and an unknown number is the not-found page. Title "Game 1234 · Square control" |
| `/hanging` | Spot the hanging piece landing page: the percentage with the same comparison, the same game in progress, New game and Open a game sections |
| `/hanging/play` | The spot the hanging piece exercise |
| `/hanging/game/{game}` | One practice game in spot the hanging piece, by its number, as for square control. Title "Game 1234 · Spot the hanging piece" |
| `/tactics` | The piece categories |
| `/tactics/{piece}` | Play tactics; `piece` is one of the six piece types or `all` |
| `/progress`, `/settings`, `/credits`, `/privacy` | As named |
| `/sitemap.xml` | Lists the home page, `/guess`, the master pages and master game pages; cached publicly for one hour |
| `/about` | About |

- The game list is sorted by year and shows 30 games per page.
- Its query parameters are `q`, `color`, `year_from`, `year_to` and `page`. The search box `q` matches opponent and event, which is how those two are filtered.
- The list receives each game's details as page data, never its moves.
- Every public page's source carries a readable title and meta description, written by the server, such as "Guess the move: Capablanca vs. Marshall, New York 1918".
- A practice game's address has the title "Game 1234 · Square control" or "Game 1234 · Spot the hanging piece", and the description "Game 1234 in square control." or "Game 1234 in spot the hanging piece." followed by the mode's landing line. The game addresses are left out of the sitemap. Added on 18 October 2026.
- An address that matches no page, including a master or game that does not exist, shows the site's own not-found page in the site's style rather than the framework's default. It is built with browsing in step 16.

**Data endpoints**

| Endpoint | Returns | Cached for |
| --- | --- | --- |
| `GET /api/master-games/{id}` | One master game with its details and moves | 1 day |
| `GET /api/practice-games/ids` | Every practice game, as pairs of ID and length in plies | 1 hour |
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
  "opponent_short_name": "Marshall",
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

A practice game ID list response, with each game's `ply_count` beside its ID so that the browser can pick by game length. Until 14 October 2026 it was `{ "ids": [1, 2, 3] }`; it changed before the first deployment, so no cached copy of the old shape exists.

```json
{ "items": [[1, 64], [2, 38], [3, 97]] }
```

A practice game response:

```json
{
  "id": 7,
  "ply_count": 64,
  "answers_version": 6,
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

- The ID list is ordered by ID, so it is the same on every request. With no games loaded it is an empty list, not an error. Each entry is the game's ID and its `ply_count`.
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

- Square control and spot the hanging piece: the browser fetches the ID list once per visit, keeps the games of the chosen length, picks at random an ID it has not played in that mode, and fetches that game. Both modes use the same two endpoints. The skipped opening is worked out in the browser from the game's moves, so nothing on the server changes with it.
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

All user data lives in one IndexedDB database in the browser, opened through the `idb` library. The database is named `chess-training` until the site has a name. It started at version 1, was at version 2 from 13 October 2026, when the three `hanging` stores were added for spot the hanging piece, and has been at version 3 since 19 October 2026, when the `dailyTallies` store was added for the results by day. Nothing had been written to the three `square` stores by version 2, so their record shapes changed without a conversion. The upgrade to version 3 only creates the new, empty store: it changes and converts nothing already stored, so all existing progress is kept.

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
| `dailyTallies` | `mode` and `date` together | Attempts and correct answers per mode and per local date. Only the two marking modes write it so far |

**Record shapes**

```ts
type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
type SquarePhase = 'lost' | 'controlled'
type Tally = { attempts: number; correct: number }
type Guess = { uci: string; correct: boolean }

type Settings = {
  appearance: 'light' | 'dark' | 'system' // default 'system'
  boardTheme: string // 'olive', 'brown', 'blue' or 'green'; default 'olive'
  pieceSet: string // 'maestro', 'fantasy', 'merida' or 'cardinal'; default 'maestro'
  boardSizePx: number | null // larger screens only; null means the 560 default
  sound: boolean // default false
  moveInput: 'tap' | 'drag' | 'both' // default 'both'
  opponentDelaySeconds: number // 1 to 5, default 3
  markingPalette: string // 'standard' or 'colour-blind'; default 'standard'
  tacticsAutoNext: boolean // default false
  squareLength: 'any' | 'short' | 'medium' | 'long' // square control's game length; default 'any'
  squareSkipMoves: number // full moves skipped at the start in square control, 0 to 10; default 0
  hangingLength: 'any' | 'short' | 'medium' | 'long' // the same for spot the hanging piece
  hangingSkipMoves: number // the same for spot the hanging piece
}

type MasterGameRecord = {
  gameId: number
  masterSlug: string
  finished: { correct: number; total: number; guesses: Guess[]; finishedAt: string } | null
  current: { guesses: Guess[]; startedAt: string; updatedAt: string } | null
}

type SquareSession = {
  gameId: number
  ply: number
  phase: SquarePhase
  rook: boolean
  results: boolean[] // how the move's earlier phases scored, in order
  updatedAt: string
}

type SquareSeen = { gameId: number; status: 'finished' | 'abandoned'; at: string }

type SquareTallies = Record<SquarePhase, Record<PieceType, Tally>>

type HangingSession = { gameId: number; ply: number; updatedAt: string }

type HangingSeen = { gameId: number; status: 'finished' | 'abandoned'; at: string }

type HangingTally = Tally // the one record in hangingTallies

type PuzzleSeen = { puzzleId: number; piece: PieceType; solved: boolean; at: string }

type TacticsTallies = Record<PieceType, Tally>

type DailyMode = 'hanging' | 'squares' | 'tactics' | 'guess'

type DailyTallies = {
  mode: DailyMode
  date: string // the local date in the browser's time zone, as '2026-10-19'
  tallies: Partial<Record<string, Tally>> // one tally per part of the mode
}
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
- `results` holds whether each of the move's earlier phases scored, in their order, so the phase tabs show their tick or cross on resuming. It is empty at a move's first phase. Added in build step 27; nothing had been written to the store before then, so the shape changed without a conversion.
- The session is saved when a phase is submitted, pointing at what comes next. Leaving during the pause after a phase that was exactly right therefore resumes at the next phase or move.
- The session is first saved when a game is picked, at move 1 and its first phase. When the last phase of a game is submitted, the game is recorded as finished and the session is deleted.
- A phase's tally and the session it leaves behind are written together, in one transaction: either both are saved or neither is. After the last phase of a game, the tally, the finished game and the deleted session are one transaction too. A "Next game" pressed straight after a phase ends waits for that write before it records the game as abandoned, so an ended phase is never lost, and a phase that has not ended is never counted. Settled in build step 28.
- Marks that were not submitted are not saved.
- The percentage shown for a phase is the total across the six piece types.
- Pressing next game before the end records the game as abandoned.
- When every practice game of the chosen length is in `squareSeen`, the records of those games are deleted from it, without a message, and the others are kept. With the length set to Any, that is every game, as before 14 October 2026.
- `squareLength` and `squareSkipMoves` in the settings are the landing page's two choices. They are read when a game is picked, and the session needs nothing more: its `ply` already says where the game stands, so a game started after a skipped opening resumes like any other. A saved value that is not one of the choices falls back to the default.
- A session whose game no longer exists, or whose `ply`, `phase` and `rook` do not name a phase of that game, is deleted, and a new game is picked.
- A game opened by its number needs no new store or field: it is saved as the session at move 1 and its first phase, like a picked game, after a different game in progress is recorded in `squareSeen` as abandoned. When the session is already that game, it is left as it is. Its seen record, if it has one from an earlier visit, is kept until the game is finished or abandoned again, when it is written afresh. Added on 18 October 2026.

**Spot the hanging piece**

- The mode's progress is its own. Nothing here reads or writes the three `square` stores, and square control does not touch the three `hanging` stores, so a game seen in one mode is still unseen in the other.
- `ply` is the move being worked on. Each move has one phase, so the move is all that is needed to resume.
- The phase is added to the one tally at the moment it is submitted. There is no split by piece.
- The session, unsubmitted marks, next game, abandoned games, a session that names no move of its game and a game opened by its number work as in square control. A move has no earlier phases, so the session has no `results`.
- When every practice game of the chosen length is in `hangingSeen`, the records of those games are deleted from it, without a message, and the others are kept.
- `hangingLength` and `hangingSkipMoves` are this mode's two choices, kept apart from square control's.

**Tactics**

- `tacticsAutoNext` in the settings is the Auto next toggle on the tactics play screen. It is saved when the toggle is pressed and read when the play screen opens, in every category.
- A puzzle is recorded at the first attempt, and `solved` is the result of that attempt. It is recorded once that result is decided: at the first wrong move, or at the final capture. The tally of the puzzle's own piece is counted at the same moment, and a puzzle already recorded is not counted again.
- There is one record per puzzle, whichever category it was played in.
- When a category has no unseen puzzles left, that piece's records in `puzzlesSeen` are deleted. The tallies are kept.
- For the all pieces option, the pool is every unseen puzzle across the six categories. When it is empty, all records in `puzzlesSeen` are deleted.

**Results by day**

Added on 19 October 2026, to compare the last seven days with the seven before (see the landing pages of Mode 2 and Mode 4, and the progress page).

- There is one record per mode and per local date, made the first time a phase is counted that day. `date` is the date in the browser's own time zone when the phase is counted, so a day is the user's day. It is the one date not stored in UTC.
- `tallies` holds one tally per part of the mode, counted exactly as the mode's running tally counts it: one attempt per counted phase, and one correct when the phase scored. Spot the hanging piece has the one part `hanging`. Square control has `lost` and `controlled`, kept apart as its tallies are; the king's and the rook's phases of a castling move count in them as well, and the split by piece is not kept by day.
- The shape is meant to serve tactics by piece and guess the move later, with `tactics` and `guess` as the mode and, for example, a part per piece or per master. They neither record nor show anything by day yet.
- A phase's daily record is written in the same transaction as its running tally and the session it leaves behind, so either all of them are saved or none is. If any write in it fails, the transaction is abandoned.
- The windows are worked out in the browser when a page shows them: the last seven days are today and the six days before it, and the seven before are the seven days before those. Days in neither window are left out, and the records stay.
- History starts when version 3 is first opened. Play before then stays in the running tallies, has no date, and is not guessed at.
- When storage is unavailable, the phases of the visit are counted by day in memory as well, as the running tallies are, until the page is reloaded.

**General rules**

- All reading and writing goes through one storage module. Pages never use IndexedDB directly.
- Dates are stored as ISO 8601 text in UTC, except the local date of the results by day.
- The reset progress button clears every store except `settings` and `meta`: `masterGames`, `squareSession`, `squareSeen`, `squareTallies`, `hangingSession`, `hangingSeen`, `hangingTallies`, `puzzlesSeen`, `tacticsTallies` and, since 19 October 2026, `dailyTallies`, in one transaction. It also clears what the marking modes counted in memory during the visit, by day as well. Settled in build step 30.
- On first use, the site asks the browser for persistent storage where that is supported.
- If storage is unavailable, as in some private browsing modes, the site still works for the visit and shows a notice that progress will not be saved.
- A change to the structure raises the database version and runs an upgrade step. Stores are never deleted to make a change.

## Appendix H: Share summary, code layout and agent rules

These are the remaining details an agent would otherwise have to guess.

**Share summary**

```text
Asanfa Chess Trainer · Guess the move
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
