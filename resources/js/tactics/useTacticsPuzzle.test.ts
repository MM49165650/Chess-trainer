// One tactics puzzle, played through: solving it, failing it, retrying,
// showing the solution and stepping through it. The positions are made up
// for the test.

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { parseMove, type MoveParts } from '@/chess/conventions';
import { positionsFrom } from '@/chess/game';
import type { PuzzleData } from '@/generated/data';
import {
    AUTO_NEXT_DELAY_MS,
    REPLY_DELAY_MS,
    SETUP_DELAY_MS,
    useTacticsPuzzle,
} from './useTacticsPuzzle';

// The king steps aside, the knight forks king and rook, and takes the rook.
const fork: PuzzleData = {
    id: 1,
    lichess_id: 'made1',
    fen: 'r2k4/8/8/3N4/8/8/8/6K1 b - - 0 1',
    setup_move: 'd8e8',
    first_move: 'd5c7',
    reply_move: 'e8d7',
    second_move: 'c7a8',
    piece: 'knight',
    rating: 800,
};

// The pawn promotes with check, and the new queen takes the knight.
const promotion: PuzzleData = {
    id: 2,
    lichess_id: 'made2',
    fen: '6k1/1P6/8/4n3/8/r7/8/6K1 b - - 0 1',
    setup_move: 'a3a2',
    first_move: 'b7b8q',
    reply_move: 'g8h7',
    second_move: 'b8e5',
    piece: 'pawn',
    rating: 900,
};

function parts(text: string): MoveParts {
    const move = parseMove(text);

    if (move === null) {
        throw new Error(`Not a move: ${text}`);
    }

    return move;
}

function positions(puzzle: PuzzleData): string[] {
    return positionsFrom(puzzle.fen, [
        puzzle.setup_move,
        puzzle.first_move,
        puzzle.reply_move,
        puzzle.second_move,
    ]);
}

/** A puzzle with the setup move already played, waiting for the user. */
function started(puzzle: PuzzleData) {
    const state = useTacticsPuzzle(puzzle);

    vi.advanceTimersByTime(SETUP_DELAY_MS);

    return state;
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

test('a correct first and second move solves the puzzle', () => {
    const puzzle = useTacticsPuzzle(fork);

    expect(puzzle.status.value).toBe('setup');
    expect(puzzle.fen.value).toBe(positions(fork)[0]);

    vi.advanceTimersByTime(SETUP_DELAY_MS);

    expect(puzzle.status.value).toBe('solve');
    expect(puzzle.lastMove.value).toEqual(parts('d8e8'));
    expect(puzzle.solverColor).toBe('white');

    puzzle.move(parts('d5c7'));

    expect(puzzle.status.value).toBe('reply');

    vi.advanceTimersByTime(REPLY_DELAY_MS);

    expect(puzzle.status.value).toBe('solve');
    expect(puzzle.fen.value).toBe(positions(fork)[3]);

    puzzle.move(parts('c7a8'));

    expect(puzzle.status.value).toBe('over');
    expect(puzzle.outcome.value).toBe('solved');
    expect(puzzle.fen.value).toBe(positions(fork)[4]);
});

test('a wrong first move fails the puzzle, and the retry starts from the same position', () => {
    const puzzle = started(fork);
    const before = puzzle.fen.value;

    puzzle.move(parts('d5b6'));

    expect(puzzle.failed.value).toBe(true);
    expect(puzzle.lastAttemptWrong.value).toBe(true);
    expect(puzzle.status.value).toBe('solve');
    expect(puzzle.fen.value).toBe(before);
    expect(puzzle.fen.value).toBe(positions(fork)[1]);

    // The retry is made from that position, and carries on from there.
    puzzle.move(parts('d5c7'));

    expect(puzzle.lastAttemptWrong.value).toBe(false);
    expect(puzzle.status.value).toBe('reply');
    expect(puzzle.fen.value).toBe(positions(fork)[2]);
});

test('a wrong second move after a correct first move fails the puzzle', () => {
    const puzzle = started(fork);

    puzzle.move(parts('d5c7'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);

    expect(puzzle.failed.value).toBe(false);

    puzzle.move(parts('c7e6'));

    expect(puzzle.failed.value).toBe(true);
    expect(puzzle.status.value).toBe('solve');

    // The retry starts where the wrong move was made, not at the first move.
    expect(puzzle.fen.value).toBe(positions(fork)[3]);
});

test('a later correct answer still leaves the puzzle failed', () => {
    const puzzle = started(fork);

    puzzle.move(parts('d5b6'));
    puzzle.move(parts('d5c7'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);
    puzzle.move(parts('c7a8'));

    expect(puzzle.status.value).toBe('over');
    expect(puzzle.failed.value).toBe(true);
    expect(puzzle.outcome.value).toBe('failed');
});

test('show solution plays only the missed move, and the arrows then reach every position', () => {
    const puzzle = started(fork);
    const all = positions(fork);

    // There is no solution to show before a failure.
    expect(puzzle.canShowSolution.value).toBe(false);
    puzzle.showSolution();
    expect(puzzle.fen.value).toBe(all[1]);
    expect(puzzle.canStepBack.value).toBe(false);

    puzzle.move(parts('d5b6'));
    expect(puzzle.canShowSolution.value).toBe(true);

    puzzle.showSolution();

    // The missed first move is on the board, and nothing after it.
    expect(puzzle.fen.value).toBe(all[2]);
    expect(puzzle.lastMove.value).toEqual(parts('d5c7'));
    expect(puzzle.status.value).toBe('over');
    expect(puzzle.outcome.value).toBe('failed');

    // The opponent's reply does not play by itself.
    vi.advanceTimersByTime(10 * REPLY_DELAY_MS);
    expect(puzzle.fen.value).toBe(all[2]);

    // The board no longer takes a move.
    puzzle.move(parts('e8d7'));
    expect(puzzle.fen.value).toBe(all[2]);

    // Back to the position before the setup move.
    puzzle.stepBack();
    expect(puzzle.fen.value).toBe(all[1]);
    puzzle.stepBack();
    expect(puzzle.fen.value).toBe(all[0]);
    expect(puzzle.lastMove.value).toBeNull();
    expect(puzzle.canStepBack.value).toBe(false);
    puzzle.stepBack();
    expect(puzzle.fen.value).toBe(all[0]);

    // Forward through the solution to the final capture.
    const seen: string[] = [puzzle.fen.value];

    while (puzzle.canStepForward.value) {
        puzzle.stepForward();
        seen.push(puzzle.fen.value);
    }

    expect(seen).toEqual(all);
    expect(puzzle.lastMove.value).toEqual(parts('c7a8'));
    puzzle.stepForward();
    expect(puzzle.fen.value).toBe(all[4]);
    expect(puzzle.outcome.value).toBe('failed');

    // When the second move is the one missed, that is the move played.
    const later = started(fork);

    later.move(parts('d5c7'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);
    later.move(parts('c7e6'));
    later.showSolution();

    expect(later.fen.value).toBe(all[4]);
    expect(later.canStepForward.value).toBe(false);
    expect(later.canStepBack.value).toBe(true);
});

test('redo resets the board but keeps the result', () => {
    const all = positions(fork);
    const puzzle = started(fork);

    // Redo does nothing while the puzzle is still being solved.
    puzzle.redo();
    expect(puzzle.fen.value).toBe(all[1]);

    puzzle.move(parts('d5c7'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);
    puzzle.move(parts('c7a8'));

    expect(puzzle.result.value).toBe('solved');

    puzzle.redo();

    // Back before the setup move, which plays by itself again.
    expect(puzzle.fen.value).toBe(all[0]);
    expect(puzzle.lastMove.value).toBeNull();
    expect(puzzle.status.value).toBe('setup');
    expect(puzzle.canStepBack.value).toBe(false);
    expect(puzzle.canStepForward.value).toBe(false);
    expect(puzzle.result.value).toBe('solved');

    vi.advanceTimersByTime(SETUP_DELAY_MS);

    expect(puzzle.status.value).toBe('solve');
    expect(puzzle.fen.value).toBe(all[1]);

    // A wrong move the second time round does not undo the solve.
    puzzle.move(parts('d5b6'));
    puzzle.showSolution();

    expect(puzzle.status.value).toBe('over');
    expect(puzzle.result.value).toBe('solved');
    expect(puzzle.outcome.value).toBe('solved');

    // And a failed puzzle stays failed when it is then done cleanly.
    const lost = started(fork);

    lost.move(parts('d5b6'));
    lost.showSolution();
    lost.redo();

    expect(lost.fen.value).toBe(all[0]);
    expect(lost.solutionShown.value).toBe(false);

    vi.advanceTimersByTime(SETUP_DELAY_MS);
    lost.move(parts('d5c7'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);
    lost.move(parts('c7a8'));

    expect(lost.result.value).toBe('failed');
    expect(lost.outcome.value).toBe('failed');
});

test('auto next moves on only after a solve, and anything pressed during the pause cancels it', () => {
    const autoNext = ref(true);
    const moved = vi.fn();

    // Plays the fork through, with a wrong move first when asked to.
    function play(wrongFirst: boolean) {
        const puzzle = useTacticsPuzzle(fork, autoNext, moved);

        vi.advanceTimersByTime(SETUP_DELAY_MS);

        if (wrongFirst) {
            puzzle.move(parts('d5b6'));
        }

        puzzle.move(parts('d5c7'));
        vi.advanceTimersByTime(REPLY_DELAY_MS);
        puzzle.move(parts('c7a8'));

        return puzzle;
    }

    // Solved: the final capture stays on the board for the pause.
    const solved = play(false);

    expect(solved.autoNextPending.value).toBe(true);
    vi.advanceTimersByTime(AUTO_NEXT_DELAY_MS - 1);
    expect(moved).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(moved).toHaveBeenCalledTimes(1);
    expect(solved.autoNextPending.value).toBe(false);
    moved.mockClear();

    // Failed, then finished on a retry: it never moves on by itself.
    const failed = play(true);

    expect(failed.autoNextPending.value).toBe(false);
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    // Failed, with the solution shown: the same.
    const shown = useTacticsPuzzle(fork, autoNext, moved);

    vi.advanceTimersByTime(SETUP_DELAY_MS);
    shown.move(parts('d5b6'));
    shown.showSolution();
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    // Redo during the pause cancels it.
    const redone = play(false);

    redone.redo();
    expect(redone.autoNextPending.value).toBe(false);
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    // So does an arrow, in either direction.
    const steppedBack = play(false);

    steppedBack.stepBack();
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    const steppedForward = play(false);

    steppedForward.stepForward();
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    // So does switching auto next off.
    const switchedOff = play(false);

    autoNext.value = false;
    expect(switchedOff.autoNextPending.value).toBe(false);
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();

    // And with auto next off, a solved puzzle stays where it is.
    const off = play(false);

    expect(off.autoNextPending.value).toBe(false);
    vi.advanceTimersByTime(10 * AUTO_NEXT_DELAY_MS);
    expect(moved).not.toHaveBeenCalled();
});

test('a promotion move counts the promotion piece', () => {
    const wrong = started(promotion);

    // The same squares with another piece is a different move.
    wrong.move(parts('b7b8r'));

    expect(wrong.failed.value).toBe(true);
    expect(wrong.fen.value).toBe(positions(promotion)[1]);

    const right = started(promotion);

    right.move(parts('b7b8q'));
    vi.advanceTimersByTime(REPLY_DELAY_MS);
    right.move(parts('b8e5'));

    expect(right.outcome.value).toBe('solved');
});
