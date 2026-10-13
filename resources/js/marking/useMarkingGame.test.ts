// One practice game, worked through in square control: marking, submitting,
// scoring, the five phases of castling, rewinding and moving on to the next
// move. The games are made up for the test.

import { Chess } from 'chess.js';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { boardFromFen, calculateMove } from '@/chess/control';
import { parseMove, type Square } from '@/chess/conventions';
import { positionsOf } from '@/chess/game';
import type { PracticeGamePlayData } from '@/generated/data';
import { scoreMarks, stepsOf } from './phases';
import { FIRST_MOVE_DELAY_MS, useMarkingGame } from './useMarkingGame';
import { nextLabel } from './wording';

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
function started(game: PracticeGamePlayData) {
    const state = useMarkingGame(game);

    vi.advanceTimersByTime(FIRST_MOVE_DELAY_MS);

    return state;
}

type Game = ReturnType<typeof useMarkingGame>;

/** Marks exactly the answer of the phase, submits it and moves on. */
function passPhase(game: Game): void {
    game.marks.value = [...(game.step.value?.answer ?? [])];
    game.submit();
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
    const game = useMarkingGame(italian);
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

test('an ordinary move has three phases: lost, controlled, hanging', () => {
    const game = started(italian);

    expect(game.steps.value).toEqual([
        { phase: 'lost', piece: 'pawn', rook: false, answer: ['d3', 'f3'] },
        {
            phase: 'controlled',
            piece: 'pawn',
            rook: false,
            answer: ['d5', 'f5'],
        },
        { phase: 'hanging', piece: 'pawn', rook: false, answer: [] },
    ]);

    expect(game.step.value?.phase).toBe('lost');
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

test('marking nothing is right when the answer is empty', () => {
    const game = started(italian);

    passPhase(game);
    passPhase(game);

    expect(game.step.value?.phase).toBe('hanging');
    expect(game.step.value?.answer).toEqual([]);

    game.submit();

    expect(game.exact.value).toBe(true);
    expect(game.feedback.value).toEqual({ correct: [], missed: [], wrong: [] });
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

    const game = useMarkingGame(italian, (result) => {
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

test('after the hanging phase the next move plays', () => {
    const game = started(italian);
    const positions = positionsOf(italian.moves);

    passPhase(game);
    passPhase(game);

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

test('a hanging piece of either side is part of the hanging answer', () => {
    const game = started(italian);

    passMove(game);
    passMove(game);
    passPhase(game);
    passPhase(game);

    // After 2. Nf3 the knight attacks e5 and nothing defends it.
    expect(game.move.value?.san).toBe('Nf3');
    expect(game.step.value).toEqual({
        phase: 'hanging',
        piece: 'knight',
        rook: false,
        answer: ['e5'],
    });
});

test('a castling move has five phases: the king, the rook, then hanging', () => {
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
        { phase: 'hanging', piece: 'king', rook: false, answer: [] },
    ]);
});

test('the five phases of castling are submitted and scored one by one', () => {
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
        [],
    ];

    for (const selection of selections) {
        game.marks.value = selection;
        game.submit();
        labels.push(nextLabel(game.steps.value, game.stepIndex.value, true));
        game.next();
    }

    expect(game.moveResults.value).toEqual([true, true, false, true, true]);

    expect(game.results.value.slice(-5)).toEqual([
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
        { ply: 7, phase: 'hanging', rook: false, piece: 'king', exact: true },
    ]);

    expect(labels).toEqual([
        "Next: king's squares controlled",
        "Next: rook's squares lost",
        "Next: rook's squares controlled",
        'Next: hanging pieces',
        'Next game',
    ]);
});

test('an ordinary move names each next phase on the button', () => {
    const steps = stepsOf(italian.moves[0] ?? raise());

    expect([0, 1, 2].map((index) => nextLabel(steps, index, false))).toEqual([
        'Next: squares controlled',
        'Next: hanging pieces',
        'Next move',
    ]);
});

test('the game is finished after the last phase of the last move', () => {
    const game = started(short);

    passMove(game);

    expect(game.ply.value).toBe(2);
    expect(game.isLastMove.value).toBe(true);

    passPhase(game);
    passPhase(game);

    expect(game.finished.value).toBe(false);

    game.submit();

    expect(game.finished.value).toBe(true);

    // There is no move to go on to: the outcome stays where it is.
    game.next();

    expect(game.ply.value).toBe(2);
    expect(game.feedback.value).not.toBeNull();
    expect(game.results.value).toHaveLength(6);
});

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
