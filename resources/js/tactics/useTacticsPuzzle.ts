// One tactics puzzle: the opponent's setup move, the solver's first move, the
// opponent's reply and the solver's second move. A wrong move fails the
// puzzle, and the user may then retry or ask for the solution. Nothing is
// saved here.

import { computed, onScopeDispose, ref, type Ref } from 'vue';
import {
    movesEqual,
    parseMove,
    type Color,
    type MoveParts,
} from '@/chess/conventions';
import { positionsFrom } from '@/chess/game';
import { readPosition } from '@/chess/position';
import type { PuzzleData } from '@/generated/data';

// How long the board waits before each of the opponent's moves, in
// milliseconds. The setup move waits longer, so the position can be taken in.
export const SETUP_DELAY_MS = 800;
export const REPLY_DELAY_MS = 500;

// How long a solved puzzle stays on the board before auto next moves on, in
// milliseconds, so that the final capture is seen.
export const AUTO_NEXT_DELAY_MS = 500;

/** The solver's moves in a puzzle. */
export const SOLVER_MOVE_COUNT = 2;

/**
 * - `setup`: the opponent's setup move is about to play by itself.
 * - `solve`: waiting for the user's move.
 * - `reply`: the opponent's reply is about to play by itself.
 * - `over`: the puzzle is solved, or its solution has been shown.
 */
export type PuzzleStatus = 'setup' | 'solve' | 'reply' | 'over';

/**
 * With `autoNext` on, `onAutoNext` is called a moment after the puzzle is
 * solved. A failed puzzle never moves on by itself.
 */
export function useTacticsPuzzle(
    puzzle: PuzzleData,
    autoNext?: Ref<boolean>,
    onAutoNext?: () => void,
) {
    const line = [
        puzzle.setup_move,
        puzzle.first_move,
        puzzle.reply_move,
        puzzle.second_move,
    ];

    const positions = positionsFrom(puzzle.fen, line);
    const moves = line.map(parseMove);

    /** How many of the puzzle's moves are on the board as it is shown. */
    const ply = ref(0);

    /** True from the first wrong move on. A later right answer leaves it so. */
    const failed = ref(false);

    /**
     * How the first attempt ended, once it has. Doing the puzzle again
     * never changes it.
     */
    const result = ref<'solved' | 'failed' | null>(null);

    /** True while the latest attempt at the move being asked for was wrong. */
    const lastAttemptWrong = ref(false);

    const solutionShown = ref(false);

    /** True once there is nothing left to solve. The arrows then work. */
    const over = ref(false);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let autoNextTimer: ReturnType<typeof setTimeout> | null = null;

    /** True during the pause before auto next moves on. */
    const autoNextWaiting = ref(false);

    const autoNextPending = computed(
        () => autoNextWaiting.value && autoNext?.value === true,
    );

    /** Anything the user does during the pause calls the move off. */
    function cancelAutoNext(): void {
        if (autoNextTimer !== null) {
            clearTimeout(autoNextTimer);
            autoNextTimer = null;
        }

        autoNextWaiting.value = false;
    }

    // Only a puzzle solved without a wrong move moves on by itself.
    function startAutoNext(): void {
        cancelAutoNext();

        if (autoNext?.value !== true) {
            return;
        }

        autoNextWaiting.value = true;

        autoNextTimer = setTimeout(() => {
            const stillOn = autoNextPending.value;

            cancelAutoNext();

            // Switching auto next off during the pause also calls it off.
            if (stillOn) {
                onAutoNext?.();
            }
        }, AUTO_NEXT_DELAY_MS);
    }

    const status = computed<PuzzleStatus>(() => {
        if (over.value) {
            return 'over';
        }

        if (ply.value === 0) {
            return 'setup';
        }

        return ply.value % 2 === 1 ? 'solve' : 'reply';
    });

    /** The side that solves: the one to move after the setup move. */
    const solverColor: Color = readPosition(positions[1] ?? puzzle.fen).turn;

    const fen = computed(() => positions[ply.value] ?? puzzle.fen);

    const lastMove = computed<MoveParts | null>(
        () => moves[ply.value - 1] ?? null,
    );

    /** Which of the solver's moves is being asked for, counting from 1. */
    const moveNumber = computed(() =>
        Math.min(Math.ceil(ply.value / 2) || 1, SOLVER_MOVE_COUNT),
    );

    /** The result, while the puzzle is over and not being done again. */
    const outcome = computed(() => (over.value ? result.value : null));

    // The first time the puzzle is over decides its result.
    function finish(): void {
        over.value = true;
        result.value ??= failed.value ? 'failed' : 'solved';
    }

    function stopTimer(): void {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    }

    // Plays the opponent's next move by itself after a short wait.
    function playOpponentMove(delayMs: number): void {
        stopTimer();

        timer = setTimeout(() => {
            timer = null;

            if (status.value === 'setup' || status.value === 'reply') {
                ply.value += 1;
            }
        }, delayMs);
    }

    /**
     * The user's move. A wrong one fails the puzzle and leaves the position
     * as it was, so the retry starts from where the wrong move was made.
     */
    function move(attempt: MoveParts): void {
        const expected = moves[ply.value];

        if (status.value !== 'solve' || !expected) {
            return;
        }

        if (!movesEqual(attempt, expected)) {
            failed.value = true;
            lastAttemptWrong.value = true;

            return;
        }

        lastAttemptWrong.value = false;
        ply.value += 1;

        if (ply.value >= line.length) {
            finish();

            if (!failed.value && result.value === 'solved') {
                startAutoNext();
            }
        } else {
            playOpponentMove(REPLY_DELAY_MS);
        }
    }

    const canShowSolution = computed(
        () => failed.value && status.value === 'solve',
    );

    /**
     * Plays the move the user missed, and no more. The rest of the solution
     * is there to step through.
     */
    function showSolution(): void {
        if (!canShowSolution.value) {
            return;
        }

        stopTimer();
        lastAttemptWrong.value = false;
        solutionShown.value = true;
        ply.value += 1;
        finish();
    }

    /**
     * Starts the same puzzle again from before the setup move, once it is
     * over. The result stays as the first attempt left it.
     */
    function redo(): void {
        if (!over.value) {
            return;
        }

        cancelAutoNext();
        ply.value = 0;
        failed.value = false;
        lastAttemptWrong.value = false;
        solutionShown.value = false;
        over.value = false;
        playOpponentMove(SETUP_DELAY_MS);
    }

    // Once the puzzle is over, every position from before the setup move to
    // the final capture can be looked at.
    const canStepBack = computed(() => over.value && ply.value > 0);
    const canStepForward = computed(
        () => over.value && ply.value < line.length,
    );

    function stepBack(): void {
        cancelAutoNext();

        if (canStepBack.value) {
            ply.value -= 1;
        }
    }

    function stepForward(): void {
        cancelAutoNext();

        if (canStepForward.value) {
            ply.value += 1;
        }
    }

    playOpponentMove(SETUP_DELAY_MS);

    // The second argument keeps this quiet when there is no component.
    onScopeDispose(() => {
        stopTimer();
        cancelAutoNext();
    }, true);

    return {
        ply,
        fen,
        lastMove,
        status,
        solverColor,
        moveNumber,
        failed,
        lastAttemptWrong,
        solutionShown,
        result,
        outcome,
        redo,
        move,
        canShowSolution,
        showSolution,
        canStepBack,
        canStepForward,
        stepBack,
        stepForward,
        autoNextPending,
        cancelAutoNext,
    };
}
