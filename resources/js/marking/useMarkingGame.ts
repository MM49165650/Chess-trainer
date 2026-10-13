// One practice game in a marking mode, worked through move by move. Each
// move is shown and then marked in its phases. Square control has two for an
// ordinary move and four for castling; spot the hanging piece has one. Every
// phase is submitted and scored by itself. Nothing is saved here.

import { computed, onScopeDispose, ref } from 'vue';
import type { PieceType, Phase, Ply, Square } from '@/chess/conventions';
import { positionsOf } from '@/chess/game';
import type { MarkFeedback } from '@/components/board/types';
import type { PracticeGamePlayData } from '@/generated/data';
import { scoreMarks, stepsOf, type MarkingMode } from './phases';

// How long the starting position is shown before the first move plays, in
// milliseconds, so that the move is seen.
export const FIRST_MOVE_DELAY_MS = 800;

// How long a move takes to play on the board, in milliseconds. The move's
// squares are not highlighted in these modes, so it is slower than elsewhere.
export const MARKING_MOVE_ANIMATION_MS = 450;

// How long a phase that was exactly right stays on show before the game
// moves on by itself, in milliseconds, so that the tick is seen.
export const EXACT_ADVANCE_DELAY_MS = 600;

/** A submitted phase, as it will count towards the tallies. */
export type PhaseResult = {
    ply: Ply;
    phase: Phase;
    /** True for the rook's two phases of a castling move. */
    rook: boolean;
    /** The piece that moved, or the rook in the rook's two phases. */
    piece: PieceType;
    /** Whether the selection was exactly right. */
    exact: boolean;
};

/** `onSubmitted` is called once for every phase, when it is submitted. */
export function useMarkingGame(
    game: PracticeGamePlayData,
    mode: MarkingMode,
    onSubmitted?: (result: PhaseResult) => void,
) {
    // Entry 0 is the starting position and entry n the one after n plies.
    const positions = positionsOf(game.moves);
    const lastPly = game.moves.length;

    /** The move being worked on. */
    const ply = ref<Ply>(1);

    /** Which of the move's phases is being marked, counting from 0. */
    const stepIndex = ref(0);

    /** False until the first move of the game has played on the board. */
    const started = ref(false);

    const marked = ref<Square[]>([]);

    /** The outcome of the phase, once it has been submitted. */
    const feedback = ref<MarkFeedback | null>(null);

    /** True while the position before the move is shown. */
    const rewound = ref(false);

    /** Every phase submitted in this game, in order. */
    const results = ref<PhaseResult[]>([]);

    const move = computed(() => game.moves[ply.value - 1] ?? null);

    const steps = computed(() =>
        move.value === null ? [] : stepsOf(move.value, mode),
    );

    const step = computed(() => steps.value[stepIndex.value] ?? null);

    const fen = computed(() => {
        const shown =
            started.value && !rewound.value ? ply.value : ply.value - 1;

        return positions[shown] ?? '';
    });

    /** The position the move was played from. */
    const fenBefore = computed(() => positions[ply.value - 1] ?? '');

    /** Squares can be marked until the phase is submitted. */
    const canMark = computed(
        () => started.value && step.value !== null && feedback.value === null,
    );

    /**
     * The squares marked in the phase so far. They are not saved, and they
     * cannot be changed once the phase is submitted.
     */
    const marks = computed<Square[]>({
        get: () => marked.value,
        set: (squares) => {
            if (canMark.value) {
                marked.value = squares;
            }
        },
    });

    /** The phase open for marking, or null when none is. */
    const markPhase = computed(() =>
        canMark.value ? (step.value?.phase ?? null) : null,
    );

    /** Whether the phase just submitted was exactly right. */
    const exact = computed(() =>
        feedback.value === null ? null : (results.value.at(-1)?.exact ?? null),
    );

    /** How the phases of this move came out so far, in their order. */
    const moveResults = computed(() =>
        results.value
            .filter((result) => result.ply === ply.value)
            .map((result) => result.exact),
    );

    const isLastStep = computed(
        () => stepIndex.value >= steps.value.length - 1,
    );

    const isLastMove = computed(() => ply.value >= lastPly);

    /** True once the last phase of the last move has been submitted. */
    const finished = computed(
        () => feedback.value !== null && isLastStep.value && isLastMove.value,
    );

    const timer = setTimeout(() => {
        started.value = true;
    }, FIRST_MOVE_DELAY_MS);

    let advanceTimer: ReturnType<typeof setTimeout> | null = null;

    /** True while a phase that was exactly right waits to move on by itself. */
    const advancePending = ref(false);

    function cancelAdvance(): void {
        if (advanceTimer !== null) {
            clearTimeout(advanceTimer);
            advanceTimer = null;
        }

        advancePending.value = false;
    }

    onScopeDispose(() => {
        clearTimeout(timer);
        cancelAdvance();
    }, true);

    /**
     * Scores the marked squares. An empty selection is a valid answer. The
     * outcome is shown on the position after the move. A phase that was
     * exactly right moves on by itself after a pause, except at the end of
     * the game.
     */
    function submit(): void {
        const current = step.value;

        if (!canMark.value || current === null) {
            return;
        }

        const score = scoreMarks(marked.value, current.answer);

        const result: PhaseResult = {
            ply: ply.value,
            phase: current.phase,
            rook: current.rook,
            piece: current.piece,
            exact: score.exact,
        };

        feedback.value = score.feedback;
        rewound.value = false;
        results.value.push(result);
        onSubmitted?.(result);

        if (score.exact && !finished.value) {
            advancePending.value = true;
            advanceTimer = setTimeout(next, EXACT_ADVANCE_DELAY_MS);
        }
    }

    /**
     * Moves on from a submitted phase: to the move's next phase, or to the
     * next move, which then plays on the board. After the last move there
     * is nowhere to go.
     */
    function next(): void {
        cancelAdvance();

        if (feedback.value === null || finished.value) {
            return;
        }

        if (isLastStep.value) {
            ply.value += 1;
            stepIndex.value = 0;
            rewound.value = false;
        } else {
            stepIndex.value += 1;
        }

        marked.value = [];
        feedback.value = null;
    }

    /**
     * Shows the position before the move, or goes back to the one after.
     * Either way, a phase waiting to move on by itself no longer does.
     */
    function toggleRewind(): void {
        if (started.value) {
            cancelAdvance();
            rewound.value = !rewound.value;
        }
    }

    return {
        ply,
        move,
        steps,
        stepIndex,
        step,
        started,
        fen,
        fenBefore,
        marks,
        markPhase,
        canMark,
        feedback,
        exact,
        moveResults,
        results,
        rewound,
        advancePending,
        isLastMove,
        finished,
        submit,
        next,
        toggleRewind,
    };
}
