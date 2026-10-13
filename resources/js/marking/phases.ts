// The phases of one move in the two marking modes, and the scoring of a
// phase. In square control an ordinary move has two phases, and a castling
// move has four: the king's two, then the rook's two. In spot the hanging
// piece every move has one.

import {
    isSquare,
    squareSetsEqual,
    toSquareSet,
    type Phase,
    type PieceType,
    type Square,
    type SquareSet,
} from '@/chess/conventions';
import type { MarkFeedback } from '@/components/board/types';
import type { PracticeMoveData } from '@/generated/data';

/**
 * The two modes that share the marking screen: square control, and spot the
 * hanging piece. They work through the same games and the same answers.
 */
export const MARKING_MODES = ['squares', 'hanging'] as const;

export type MarkingMode = (typeof MARKING_MODES)[number];

/** One phase of one move: what is asked, about which piece, and the answer. */
export type PhaseStep = {
    phase: Phase;
    /**
     * The piece that moved, or the rook in the rook's two phases. In square
     * control it is the piece the phase is about and counts towards.
     */
    piece: PieceType;
    /** True only in the rook's two phases of a castling move. */
    rook: boolean;
    answer: SquareSet;
};

function squaresOf(names: readonly string[]): SquareSet {
    return toSquareSet(names.filter(isSquare));
}

/** The phases of a move in one mode, in the order they are marked. */
export function stepsOf(
    move: PracticeMoveData,
    mode: MarkingMode,
): PhaseStep[] {
    const step = (
        phase: Phase,
        answer: readonly string[],
        rook = false,
    ): PhaseStep => ({
        phase,
        piece: rook ? 'rook' : move.piece,
        rook,
        answer: squaresOf(answer),
    });

    if (mode === 'hanging') {
        return [step('hanging', move.hanging)];
    }

    return [
        step('lost', move.lost),
        step('controlled', move.controlled),
        ...(move.rook === null
            ? []
            : [
                  step('lost', move.rook.lost, true),
                  step('controlled', move.rook.controlled, true),
              ]),
    ];
}

/** A submitted phase: how each square came out, and whether it scores. */
export type PhaseScore = {
    feedback: MarkFeedback;
    /** A phase scores only when the selection is exactly right. */
    exact: boolean;
};

/**
 * Scores a selection against the answer. A missed square and a wrongly
 * marked square both fail the phase, and marking nothing is right when the
 * answer is empty.
 */
export function scoreMarks(
    marks: readonly Square[],
    answer: readonly Square[],
): PhaseScore {
    const marked = toSquareSet(marks);

    return {
        feedback: {
            correct: marked.filter((square) => answer.includes(square)),
            missed: answer.filter((square) => !marked.includes(square)),
            wrong: marked.filter((square) => !answer.includes(square)),
        },
        exact: squareSetsEqual(marked, answer),
    };
}
