// The phases of one move in square control, and the scoring of a phase. An
// ordinary move has three phases. A castling move has five: the king's two,
// the rook's two, then the hanging pieces.

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

/** One phase of one move: what is asked, about which piece, and the answer. */
export type PhaseStep = {
    phase: Phase;
    /**
     * The piece the phase is about, which is also the piece it counts
     * towards: the piece that moved, or the rook in the rook's two phases.
     * The hanging phase of a castling move counts towards the king.
     */
    piece: PieceType;
    /** True only in the rook's two phases of a castling move. */
    rook: boolean;
    answer: SquareSet;
};

function squaresOf(names: readonly string[]): SquareSet {
    return toSquareSet(names.filter(isSquare));
}

/** The phases of a move, in the order they are marked. */
export function stepsOf(move: PracticeMoveData): PhaseStep[] {
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

    return [
        step('lost', move.lost),
        step('controlled', move.controlled),
        ...(move.rook === null
            ? []
            : [
                  step('lost', move.rook.lost, true),
                  step('controlled', move.rook.controlled, true),
              ]),
        step('hanging', move.hanging),
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
