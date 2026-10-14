// One practice game in a marking mode, worked through move by move. Each
// move is shown and then marked in its phases. Square control has two for an
// ordinary move and four for castling; spot the hanging piece has one. Every
// phase is scored by itself, once, when it ends. Square control checks a
// phase as it is marked: it ends when the marks match the answer, or when
// the button is pressed. Spot the hanging piece ends a phase only on Submit.
// Nothing is saved here.

import { computed, onScopeDispose, ref } from 'vue';
import type { PieceType, Phase, Ply, Square } from '@/chess/conventions';
import { positionsOf } from '@/chess/game';
import type { MarkFeedback } from '@/components/board/types';
import type { PracticeGamePlayData } from '@/generated/data';
import {
    scoreMarks,
    stepsOf,
    type MarkingMode,
    type PhaseStep,
} from './phases';

// How long the starting position is shown before the first move plays, in
// milliseconds, so that the move is seen.
export const FIRST_MOVE_DELAY_MS = 800;

// How long a move takes to play on the board, in milliseconds. The move's
// squares are not highlighted in these modes, so it is slower than elsewhere.
export const MARKING_MOVE_ANIMATION_MS = 450;

// How long a phase that was exactly right stays on show before the game
// moves on by itself, in milliseconds, so that the tick is seen.
export const EXACT_ADVANCE_DELAY_MS = 600;

/** A phase that has ended, as it will count towards the tallies. */
export type PhaseResult = {
    ply: Ply;
    phase: Phase;
    /** True for the rook's two phases of a castling move. */
    rook: boolean;
    /** The piece that moved, or the rook in the rook's two phases. */
    piece: PieceType;
    /**
     * Whether the phase scores: the selection was exactly right and, in
     * square control, no wrong square was marked on the way to it.
     */
    exact: boolean;
};

/** `onSubmitted` is called once for every phase, when it ends. */
export function useMarkingGame(
    game: PracticeGamePlayData,
    mode: MarkingMode,
    onSubmitted?: (result: PhaseResult) => void,
) {
    // Entry 0 is the starting position and entry n the one after n plies.
    const positions = positionsOf(game.moves);
    const lastPly = game.moves.length;

    /** Square control checks a phase as it is marked. */
    const checksAsMarked = mode === 'squares';

    /** The move being worked on. */
    const ply = ref<Ply>(1);

    /** Which of the move's phases is being marked, counting from 0. */
    const stepIndex = ref(0);

    /** False until the first move of the game has played on the board. */
    const started = ref(false);

    const marked = ref<Square[]>([]);

    /**
     * True once a square that is not in the answer has been marked in this
     * phase of square control. The phase then counts as failed, whatever
     * is marked afterwards.
     */
    const slipped = ref(false);

    /** The outcome of the phase, once it has ended. */
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

    /** Squares can be marked until the phase has ended. */
    const canMark = computed(
        () => started.value && step.value !== null && feedback.value === null,
    );

    /**
     * The squares marked in the phase so far. They are not saved, and they
     * cannot be changed once the phase has ended. In square control every
     * change is checked against the answer.
     */
    const marks = computed<Square[]>({
        get: () => marked.value,
        set: (squares) => {
            if (!canMark.value) {
                return;
            }

            marked.value = squares;

            if (checksAsMarked) {
                checkMarks();
            }
        },
    });

    /**
     * In square control, the marked squares that are not in the answer.
     * They are shown as wrong at once, while the phase is still open.
     */
    const wrongMarks = computed<Square[]>(() => {
        const answer = step.value?.answer ?? [];

        return checksAsMarked && feedback.value === null
            ? marked.value.filter((square) => !answer.includes(square))
            : [];
    });

    /** The phase open for marking, or null when none is. */
    const markPhase = computed(() =>
        canMark.value ? (step.value?.phase ?? null) : null,
    );

    /**
     * Whether the selection the phase ended on was exactly right. In square
     * control the phase can still have failed, by a wrong square marked
     * and taken off again; `moveResults` has how it scored.
     */
    const exact = computed(() =>
        feedback.value === null
            ? null
            : feedback.value.missed.length === 0 &&
              feedback.value.wrong.length === 0,
    );

    /**
     * True when the phase ended on a selection that was exactly right but
     * failed all the same, because a wrong square had been marked on the
     * way. It is then shown as corrected, not as exactly right.
     */
    const corrected = computed(
        () => exact.value === true && results.value.at(-1)?.exact === false,
    );

    /** How the phases of this move scored so far, in their order. */
    const moveResults = computed(() =>
        results.value
            .filter((result) => result.ply === ply.value)
            .map((result) => result.exact),
    );

    const isLastStep = computed(
        () => stepIndex.value >= steps.value.length - 1,
    );

    const isLastMove = computed(() => ply.value >= lastPly);

    /** True once the last phase of the last move has ended. */
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
     * Square control: checks the marks as they change. A wrong square fails
     * the phase but leaves it open, so it can be taken off again. Marks
     * that match the answer end the phase, unless nothing is marked: an
     * empty answer is only confirmed with the button.
     */
    function checkMarks(): void {
        const current = step.value;

        if (current === null) {
            return;
        }

        if (wrongMarks.value.length > 0) {
            slipped.value = true;
        } else if (
            marked.value.length > 0 &&
            scoreMarks(marked.value, current.answer).exact
        ) {
            endPhase(current);
        }
    }

    /**
     * Ends the phase on the squares marked, as the main button does. An
     * empty selection is a valid answer.
     */
    function submit(): void {
        const current = step.value;

        if (canMark.value && current !== null) {
            endPhase(current);
        }
    }

    /**
     * Scores the phase, once, and shows the outcome on the position after
     * the move. A selection that is exactly right moves on by itself after
     * a pause, except at the end of the game.
     */
    function endPhase(current: PhaseStep): void {
        const score = scoreMarks(marked.value, current.answer);

        const result: PhaseResult = {
            ply: ply.value,
            phase: current.phase,
            rook: current.rook,
            piece: current.piece,
            exact: score.exact && !slipped.value,
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
     * Moves on from a phase that has ended: to the move's next phase, or to
     * the next move, which then plays on the board. After the last move
     * there is nowhere to go.
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
        slipped.value = false;
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
        wrongMarks,
        markPhase,
        canMark,
        feedback,
        exact,
        corrected,
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
