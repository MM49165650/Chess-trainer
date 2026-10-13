// Everything the marking modes say in words: the move that was played, the
// question of each phase, the outcome of a submitted phase, and what the
// main button offers next.

import {
    PROMOTION_PIECES,
    colorOfPly,
    parseMove,
    type Phase,
    type Ply,
} from '@/chess/conventions';
import { isCapture, isCastling, specialMoveOf } from '@/chess/game';
import type { MarkFeedback } from '@/components/board/types';
import type { PracticeMoveData } from '@/generated/data';
import type { PhaseStep } from './phases';

const PHASE_NAMES: Readonly<Record<Phase, string>> = {
    lost: 'Lost',
    controlled: 'Controls',
    hanging: 'Hanging',
};

const NUMBERS = [
    'no',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
];

function inWords(count: number): string {
    return NUMBERS[count] ?? String(count);
}

function capitalised(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The piece a pawn became, or null when the move is not a promotion. */
function promotedTo(move: PracticeMoveData): string | null {
    const letter = parseMove(move.uci)?.promotion ?? null;

    return letter === null ? null : PROMOTION_PIECES[letter];
}

/**
 * A move in words. The written move, when there is one, is kept apart so
 * that it can be shown in its own case: in capitals Nf3 and bxc4 would read
 * as NF3 and BXC4.
 */
export type MoveWords = { words: string; san: string | null };

/**
 * What a move was, such as "White played Nf3", "Black took on e5" or "White
 * castled kingside". It needs the position before the move to tell an en
 * passant capture.
 */
export function moveInWords(
    ply: Ply,
    move: PracticeMoveData,
    fenBefore: string,
): MoveWords {
    const side = colorOfPly(ply) === 'white' ? 'White' : 'Black';
    const to = move.uci.slice(2, 4);
    const promoted = promotedTo(move);

    if (isCastling(move.san)) {
        const wing = move.san.startsWith('O-O-O') ? 'queenside' : 'kingside';

        return { words: `${side} castled ${wing}`, san: null };
    }

    if (promoted !== null) {
        return {
            words: isCapture(move.san)
                ? `${side} took on ${to} and promoted to a ${promoted}`
                : `${side} promoted to a ${promoted} on ${to}`,
            san: null,
        };
    }

    if (isCapture(move.san)) {
        const enPassant = specialMoveOf(fenBefore, move) === 'en passant';

        return {
            words: `${side} took on ${to}${enPassant ? ' en passant' : ''}`,
            san: null,
        };
    }

    return { words: `${side} played`, san: move.san };
}

/** The question of one phase. It names the piece the phase is about. */
export function questionOf(step: PhaseStep, move: PracticeMoveData): string {
    if (step.phase === 'hanging') {
        return 'Which pieces are hanging, on either side?';
    }

    if (step.phase === 'lost') {
        return `Which squares does the ${step.piece} no longer control?`;
    }

    // After a promotion the squares are the new piece's.
    const promoted = promotedTo(move);

    return promoted === null
        ? `Which squares does the ${step.piece} control now?`
        : `Which squares does the new ${promoted} control?`;
}

/**
 * The name of a phase, such as "Controls". On a castling move the king's and
 * the rook's phases say whose they are, as in "Rook · Lost".
 */
export function phaseName(
    step: PhaseStep,
    steps: readonly PhaseStep[],
): string {
    const name = PHASE_NAMES[step.phase];

    return hasRookPhases(steps) ? `${capitalised(step.piece)} · ${name}` : name;
}

/** True for the four phases of a castling move in square control. */
function hasRookPhases(steps: readonly PhaseStep[]): boolean {
    return steps.some((step) => step.rook);
}

/** A tab of the phase indicator, with the phases it stands for. */
export type PhaseTab = { label: string; steps: number[] };

/**
 * The tabs of the phase indicator. There is one phase to a tab: Lost and
 * Controls in square control, and Hanging alone in spot the hanging piece.
 * A castling move in square control has the tabs King and Rook, which stand
 * for two phases each.
 */
export function tabsOf(steps: readonly PhaseStep[]): PhaseTab[] {
    if (hasRookPhases(steps)) {
        return [
            { label: 'King', steps: [0, 1] },
            { label: 'Rook', steps: [2, 3] },
        ];
    }

    return steps.map((step, index) => ({
        label: PHASE_NAMES[step.phase],
        steps: [index],
    }));
}

/**
 * How a submitted phase came out, in a sentence, such as "Three squares
 * missed, one too many."
 */
export function verdictOf(feedback: MarkFeedback, phase: Phase): string {
    const noun = phase === 'hanging' ? 'piece' : 'square';
    const counted = (count: number): string =>
        `${inWords(count)} ${noun}${count === 1 ? '' : 's'}`;

    const missed = feedback.missed.length;
    const wrong = feedback.wrong.length;
    const found = feedback.correct.length;

    if (missed === 0 && wrong === 0) {
        if (found === 0) {
            return 'Nothing to mark, and nothing marked.';
        }

        if (found === 1) {
            return `The only ${noun}.`;
        }

        return found === 2 ? `Both ${noun}s.` : `All ${counted(found)}.`;
    }

    const parts = [
        ...(missed > 0 ? [`${counted(missed)} missed`] : []),
        ...(wrong > 0
            ? [`${missed > 0 ? inWords(wrong) : counted(wrong)} too many`]
            : []),
    ];

    return `${capitalised(parts.join(', '))}.`;
}

/**
 * What the main button offers once a phase has been submitted: the next
 * phase, the next move, or the next game after the last move.
 */
export function nextLabel(
    steps: readonly PhaseStep[],
    index: number,
    lastMove: boolean,
): string {
    const next = steps[index + 1];

    if (next === undefined) {
        return lastMove ? 'Next game' : 'Next move';
    }

    const what = next.phase === 'lost' ? 'lost' : 'controlled';

    // On a castling move the button says whose squares come next.
    return hasRookPhases(steps)
        ? `Next: ${next.piece}'s squares ${what}`
        : `Next: squares ${what}`;
}
