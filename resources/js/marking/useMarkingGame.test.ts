// One practice game, worked through in the two marking modes: marking,
// submitting, scoring, the phases of each mode, moving on by itself after a
// phase that was exactly right, rewinding and moving on to the next move.
// The games are made up for the test.

import { Chess } from 'chess.js';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { boardFromFen, calculateMove } from '@/chess/control';
import { parseMove, type Square } from '@/chess/conventions';
import { positionsOf } from '@/chess/game';
import type { PracticeGamePlayData } from '@/generated/data';
import { MARKING_MODES, scoreMarks, stepsOf, type MarkingMode } from './phases';
import {
    EXACT_ADVANCE_DELAY_MS,
    FIRST_MOVE_DELAY_MS,
    useMarkingGame,
} from './useMarkingGame';
import { nextLabel, tabsOf } from './wording';

/** A game from its moves, with the answers worked out as the import does. */
function madeUpGame(id: number, ucis: readonly string[]): PracticeGamePlayData {
    const chess = new Chess();

    const moves = ucis.map((uci) => {
        const parts = parseMove(uci);

        if (parts === null) {
            throw new Error(`Not a move: ${uci}`);
        }

        const before = boardFromFen(chess.fen());
        const { san } = chess.move(uci);
        const answers = calculateMove(before, boardFromFen(chess.fen()), parts);

        return {
            uci,
            san,
            piece: answers.piece,
            lost: [...answers.lost],
            controlled: [...answers.controlled],
            hanging: [...answers.hanging],
            rook:
                answers.rook === null
                    ? null
                    : {
                          lost: [...answers.rook.lost],
                          controlled: [...answers.rook.controlled],
                      },
        };
    });

    return { id, ply_count: moves.length, answers_version: 2, moves };
}

// An Italian game as far as White castling, on the seventh ply.
const italian = madeUpGame(1, [
    'e2e4',
    'e7e5',
    'g1f3',
    'b8c6',
    'f1c4',
    'f8c5',
    'e1g1',
]);

// Two moves only, so that the end of the game is soon reached.
const short = madeUpGame(2, ['e2e4', 'e7e5']);

/** A game whose first move has played, ready for marking. */
function started(game: PracticeGamePlayData, mode: MarkingMode = 'squares') {
    const state = useMarkingGame(game, mode);

    vi.advanceTimersByTime(FIRST_MOVE_DELAY_MS);

    return state;
}

type Game = ReturnType<typeof useMarkingGame>;

/** Marks exactly the answer of the phase and submits it. */
function answer(game: Game): void {
    game.marks.value = [...(game.step.value?.answer ?? [])];
    game.submit();
}

/** Answers the phase and moves on at once, as the main button does. */
function passPhase(game: Game): void {
    answer(game);
    game.next();
}

function passMove(game: Game): void {
    const from = game.ply.value;

    while (game.ply.value === from && !game.finished.value) {
        passPhase(game);
    }
}

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

test('the first move plays after a pause, and marking opens with it', () => {
    const game = useMarkingGame(italian, 'squares');
    const positions = positionsOf(italian.moves);

    expect(game.fen.value).toBe(positions[0]);
    expect(game.markPhase.value).toBeNull();

    // Nothing can be marked or submitted before the move has played.
    game.marks.value = ['d3'];
    game.submit();

    expect(game.marks.value).toEqual([]);
    expect(game.feedback.value).toBeNull();

    vi.advanceTimersByTime(FIRST_MOVE_DELAY_MS);

    expect(game.fen.value).toBe(positions[1]);
    expect(game.markPhase.value).toBe('lost');
});

test('square control: an ordinary move has two phases, lost then controlled', () => {
    const game = started(italian);

    expect(game.steps.value).toEqual([
        { phase: 'lost', piece: 'pawn', rook: false, answer: ['d3', 'f3'] },
        {
            phase: 'controlled',
            piece: 'pawn',
            rook: false,
            answer: ['d5', 'f5'],
        },
    ]);

    expect(game.step.value?.phase).toBe('lost');
    expect(tabsOf(game.steps.value).map((tab) => tab.label)).toEqual([
        'Lost',
        'Controls',
    ]);
});

test('a selection that is exactly right scores, in any order', () => {
    const game = started(italian);

    game.marks.value = ['f3', 'd3'];
    game.submit();

    expect(game.exact.value).toBe(true);
    expect(game.feedback.value).toEqual({
        correct: ['d3', 'f3'],
        missed: [],
        wrong: [],
    });
    expect(game.results.value).toEqual([
        { ply: 1, phase: 'lost', rook: false, piece: 'pawn', exact: true },
    ]);
});

test('a missed square fails the phase', () => {
    const game = started(italian);

    game.marks.value = ['d3'];
    game.submit();

    expect(game.exact.value).toBe(false);
    expect(game.feedback.value).toEqual({
        correct: ['d3'],
        missed: ['f3'],
        wrong: [],
    });
});

test('a wrongly marked square fails the phase', () => {
    const game = started(italian);

    // The square the pawn pushed to is not one it controlled.
    game.marks.value = ['d3', 'f3', 'e4'];
    game.submit();

    expect(game.exact.value).toBe(false);
    expect(game.feedback.value).toEqual({
        correct: ['d3', 'f3'],
        missed: [],
        wrong: ['e4'],
    });
});

test('marking something is wrong when the answer is empty', () => {
    expect(scoreMarks(['e4'], [])).toEqual({
        feedback: { correct: [], missed: [], wrong: ['e4'] },
        exact: false,
    });
});

test('a submitted phase cannot be marked or submitted again', () => {
    const game = started(italian);

    game.marks.value = ['d3'];
    game.submit();

    game.marks.value = ['d3', 'f3'];
    game.submit();

    expect(game.marks.value).toEqual(['d3']);
    expect(game.markPhase.value).toBeNull();
    expect(game.exact.value).toBe(false);
    expect(game.results.value).toHaveLength(1);
});

test('every submitted phase is reported once, as it is submitted', () => {
    const reported: string[] = [];

    const game = useMarkingGame(italian, 'squares', (result) => {
        reported.push(
            `${String(result.ply)} ${result.phase} ${String(result.exact)}`,
        );
    });

    vi.advanceTimersByTime(FIRST_MOVE_DELAY_MS);

    game.submit();
    game.next();
    passPhase(game);

    expect(reported).toEqual(['1 lost false', '1 controlled true']);
});

test('the next phase starts with no marks, and cannot be skipped to', () => {
    const game = started(italian);

    // Moving on needs a submitted phase.
    game.next();

    expect(game.stepIndex.value).toBe(0);

    game.marks.value = ['d3', 'f3'];
    game.submit();
    game.next();

    expect(game.step.value?.phase).toBe('controlled');
    expect(game.marks.value).toEqual([]);
    expect(game.feedback.value).toBeNull();
    expect(game.markPhase.value).toBe('controlled');
});

test('square control: after the controlled phase the next move plays', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    passPhase(game);

    // Nothing is marked, so the phase is not right and waits for the button.
    game.submit();

    // The outcome stays on the position after the move just marked.
    expect(game.ply.value).toBe(1);
    expect(game.fen.value).toBe(positions[1]);
    expect(nextLabel(game.steps.value, game.stepIndex.value, false)).toBe(
        'Next move',
    );

    game.next();

    expect(game.ply.value).toBe(2);
    expect(game.stepIndex.value).toBe(0);
    expect(game.fen.value).toBe(positions[2]);
    expect(game.move.value?.san).toBe('e5');
    expect(game.markPhase.value).toBe('lost');
    expect(game.moveResults.value).toEqual([]);
});

test('square control: a castling move has four phases, the king then the rook', () => {
    const game = started(italian);

    for (let ply = 1; ply < 7; ply += 1) {
        passMove(game);
    }

    expect(game.move.value?.san).toBe('O-O');
    expect(game.steps.value).toEqual([
        {
            phase: 'lost',
            piece: 'king',
            rook: false,
            answer: ['d1', 'd2', 'e2'],
        },
        {
            phase: 'controlled',
            piece: 'king',
            rook: false,
            answer: ['f1', 'f2', 'g2', 'h1', 'h2'],
        },
        { phase: 'lost', piece: 'rook', rook: true, answer: ['f1', 'h2'] },
        {
            phase: 'controlled',
            piece: 'rook',
            rook: true,
            answer: ['d1', 'e1', 'f2', 'g1'],
        },
    ]);

    expect(tabsOf(game.steps.value)).toEqual([
        { label: 'King', steps: [0, 1] },
        { label: 'Rook', steps: [2, 3] },
    ]);
});

test('the four phases of castling are submitted and scored one by one', () => {
    const game = started(italian);

    for (let ply = 1; ply < 7; ply += 1) {
        passMove(game);
    }

    const labels: string[] = [];

    // The king's lost squares are right, and the rook's are not: f1 is
    // lost by the rook although the king now controls it.
    const selections: Square[][] = [
        ['d1', 'd2', 'e2'],
        ['f1', 'f2', 'g2', 'h1', 'h2'],
        ['h2'],
        ['d1', 'e1', 'f2', 'g1'],
    ];

    for (const selection of selections) {
        game.marks.value = selection;
        game.submit();
        labels.push(nextLabel(game.steps.value, game.stepIndex.value, true));
        game.next();
    }

    expect(game.moveResults.value).toEqual([true, true, false, true]);

    expect(game.results.value.slice(-4)).toEqual([
        { ply: 7, phase: 'lost', rook: false, piece: 'king', exact: true },
        {
            ply: 7,
            phase: 'controlled',
            rook: false,
            piece: 'king',
            exact: true,
        },
        { ply: 7, phase: 'lost', rook: true, piece: 'rook', exact: false },
        {
            ply: 7,
            phase: 'controlled',
            rook: true,
            piece: 'rook',
            exact: true,
        },
    ]);

    expect(labels).toEqual([
        "Next: king's squares controlled",
        "Next: rook's squares lost",
        "Next: rook's squares controlled",
        'Next game',
    ]);
});

test('square control: an ordinary move names what comes next on the button', () => {
    const steps = stepsOf(italian.moves[0] ?? raise(), 'squares');

    expect([0, 1].map((index) => nextLabel(steps, index, false))).toEqual([
        'Next: squares controlled',
        'Next move',
    ]);
});

test('square control: the game is finished after the last phase of the last move', () => {
    const game = started(short);

    passMove(game);

    expect(game.ply.value).toBe(2);
    expect(game.isLastMove.value).toBe(true);

    passPhase(game);

    expect(game.finished.value).toBe(false);

    game.submit();

    expect(game.finished.value).toBe(true);

    // There is no move to go on to: the outcome stays where it is.
    game.next();

    expect(game.ply.value).toBe(2);
    expect(game.feedback.value).not.toBeNull();
    expect(game.results.value).toHaveLength(4);
});

test('spot the hanging piece: every move has one phase, castling as well', () => {
    const game = started(italian, 'hanging');

    expect(game.steps.value).toEqual([
        { phase: 'hanging', piece: 'pawn', rook: false, answer: [] },
    ]);
    expect(game.markPhase.value).toBe('hanging');
    expect(tabsOf(game.steps.value)).toEqual([
        { label: 'Hanging', steps: [0] },
    ]);

    for (let ply = 1; ply < 7; ply += 1) {
        passMove(game);
    }

    expect(game.move.value?.san).toBe('O-O');
    expect(game.steps.value).toEqual([
        { phase: 'hanging', piece: 'king', rook: false, answer: [] },
    ]);
});

test('spot the hanging piece: a hanging piece of either side is in the answer', () => {
    const game = started(italian, 'hanging');

    passMove(game);
    passMove(game);

    // After 2. Nf3 the knight attacks e5 and nothing defends it: a black
    // pawn, hanging after a move by White.
    expect(game.move.value?.san).toBe('Nf3');
    expect(game.step.value).toEqual({
        phase: 'hanging',
        piece: 'knight',
        rook: false,
        answer: ['e5'],
    });

    game.marks.value = ['e5'];
    game.submit();

    expect(game.exact.value).toBe(true);
    expect(game.results.value.at(-1)).toEqual({
        ply: 3,
        phase: 'hanging',
        rook: false,
        piece: 'knight',
        exact: true,
    });
});

test('spot the hanging piece: marking nothing is right when nothing hangs', () => {
    const game = started(italian, 'hanging');

    expect(game.step.value?.answer).toEqual([]);

    game.submit();

    expect(game.exact.value).toBe(true);
    expect(game.feedback.value).toEqual({ correct: [], missed: [], wrong: [] });
});

test('spot the hanging piece: the next move plays after each phase, to the end of the game', () => {
    const game = started(short, 'hanging');
    const positions = positionsOf(short.moves);

    // A pawn that does not hang is marked, so the button is needed.
    game.marks.value = ['e4'];
    game.submit();

    expect(game.exact.value).toBe(false);
    expect(nextLabel(game.steps.value, game.stepIndex.value, false)).toBe(
        'Next move',
    );

    game.next();

    expect(game.ply.value).toBe(2);
    expect(game.fen.value).toBe(positions[2]);
    expect(game.markPhase.value).toBe('hanging');
    expect(game.finished.value).toBe(false);

    game.submit();

    expect(game.finished.value).toBe(true);
    expect(nextLabel(game.steps.value, game.stepIndex.value, true)).toBe(
        'Next game',
    );
    expect(game.results.value).toHaveLength(2);
});

test('square control: a phase that is exactly right moves on by itself after a pause', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    answer(game);

    // The tick and the outcome are on show first.
    expect(game.exact.value).toBe(true);
    expect(game.moveResults.value).toEqual([true]);
    expect(game.advancePending.value).toBe(true);

    vi.advanceTimersByTime(EXACT_ADVANCE_DELAY_MS - 1);

    expect(game.stepIndex.value).toBe(0);
    expect(game.feedback.value).not.toBeNull();

    vi.advanceTimersByTime(1);

    expect(game.advancePending.value).toBe(false);
    expect(game.step.value?.phase).toBe('controlled');
    expect(game.feedback.value).toBeNull();
    expect(game.marks.value).toEqual([]);

    // After the last phase of the move, the next move plays.
    answer(game);
    vi.advanceTimersByTime(EXACT_ADVANCE_DELAY_MS);

    expect(game.ply.value).toBe(2);
    expect(game.stepIndex.value).toBe(0);
    expect(game.fen.value).toBe(positions[2]);
    expect(game.markPhase.value).toBe('lost');
});

test('spot the hanging piece: a phase that is exactly right plays the next move after a pause', () => {
    const game = started(italian, 'hanging');
    const positions = positionsOf(italian.moves);

    game.submit();

    expect(game.exact.value).toBe(true);
    expect(game.advancePending.value).toBe(true);

    vi.advanceTimersByTime(EXACT_ADVANCE_DELAY_MS - 1);

    expect(game.ply.value).toBe(1);
    expect(game.feedback.value).not.toBeNull();

    vi.advanceTimersByTime(1);

    expect(game.ply.value).toBe(2);
    expect(game.fen.value).toBe(positions[2]);
    expect(game.feedback.value).toBeNull();
    expect(game.markPhase.value).toBe('hanging');
});

test.each(MARKING_MODES)(
    '%s: a phase with a square missed or wrong never moves on by itself',
    (mode) => {
        const game = started(italian, mode);

        game.marks.value = ['e4'];
        game.submit();

        expect(game.exact.value).toBe(false);
        expect(game.advancePending.value).toBe(false);

        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect(game.ply.value).toBe(1);
        expect(game.stepIndex.value).toBe(0);
        expect(game.feedback.value).not.toBeNull();

        // The button continues.
        game.next();

        expect(game.feedback.value).toBeNull();
    },
);

test.each(MARKING_MODES)(
    '%s: marks that match the answer do nothing until they are submitted',
    (mode) => {
        const game = started(italian, mode);

        game.marks.value = [...(game.step.value?.answer ?? [])];

        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect(game.advancePending.value).toBe(false);
        expect(game.feedback.value).toBeNull();
        expect(game.results.value).toEqual([]);
        expect(game.ply.value).toBe(1);
        expect(game.stepIndex.value).toBe(0);
    },
);

test.each(MARKING_MODES)(
    '%s: rewind during the pause cancels the move on, for good',
    (mode) => {
        const game = started(italian, mode);
        const positions = positionsOf(italian.moves);

        answer(game);
        vi.advanceTimersByTime(EXACT_ADVANCE_DELAY_MS - 1);
        game.toggleRewind();

        expect(game.advancePending.value).toBe(false);
        expect(game.fen.value).toBe(positions[0]);

        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect(game.ply.value).toBe(1);
        expect(game.stepIndex.value).toBe(0);
        expect(game.exact.value).toBe(true);

        // Switching rewind off again does not bring the move on back.
        game.toggleRewind();
        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect(game.advancePending.value).toBe(false);
        expect(game.feedback.value).not.toBeNull();

        // It stops on the outcome, and the button continues.
        game.next();

        expect(game.feedback.value).toBeNull();
    },
);

test.each(MARKING_MODES)(
    '%s: the button during the pause moves on at once, and only once',
    (mode) => {
        const game = started(italian, mode);

        answer(game);
        game.next();

        const reached = [game.ply.value, game.stepIndex.value];

        expect(reached).not.toEqual([1, 0]);
        expect(game.advancePending.value).toBe(false);
        expect(game.feedback.value).toBeNull();

        // The pause that was running does not move on a second time.
        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect([game.ply.value, game.stepIndex.value]).toEqual(reached);
        expect(game.feedback.value).toBeNull();
    },
);

test.each(MARKING_MODES)(
    '%s: the end of the game waits for the button, even when exactly right',
    (mode) => {
        const game = started(short, mode);

        passMove(game);

        // Every phase of the last move but its last, then the last.
        for (let at = 1; at < game.steps.value.length; at += 1) {
            passPhase(game);
        }

        answer(game);

        expect(game.finished.value).toBe(true);
        expect(game.exact.value).toBe(true);
        expect(game.advancePending.value).toBe(false);

        vi.advanceTimersByTime(10 * EXACT_ADVANCE_DELAY_MS);

        expect(game.finished.value).toBe(true);
        expect(game.ply.value).toBe(2);
        expect(game.feedback.value).not.toBeNull();
    },
);

test('rewind shows the position before the move, and keeps the marks', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    passMove(game);

    game.marks.value = ['d6'];
    game.toggleRewind();

    expect(game.rewound.value).toBe(true);
    expect(game.fen.value).toBe(positions[1]);
    expect(game.fenBefore.value).toBe(positions[1]);

    // Squares can still be marked while the earlier position is shown.
    game.marks.value = ['d6', 'f6'];

    expect(game.markPhase.value).toBe('lost');

    game.toggleRewind();

    expect(game.rewound.value).toBe(false);
    expect(game.fen.value).toBe(positions[2]);
    expect(game.marks.value).toEqual(['d6', 'f6']);
});

test('submitting goes back to the position after the move', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    game.toggleRewind();
    game.marks.value = ['d3', 'f3'];
    game.submit();

    expect(game.rewound.value).toBe(false);
    expect(game.fen.value).toBe(positions[1]);
    expect(game.exact.value).toBe(true);

    // The earlier position can be looked at again with the outcome showing.
    game.toggleRewind();

    expect(game.fen.value).toBe(positions[0]);
    expect(game.feedback.value).not.toBeNull();
});

test('a new move is never shown rewound', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    passPhase(game);

    game.submit();
    game.toggleRewind();
    game.next();

    expect(game.ply.value).toBe(2);
    expect(game.rewound.value).toBe(false);
    expect(game.fen.value).toBe(positions[2]);
});

function raise(): never {
    throw new Error('The made-up game has no such move.');
}
