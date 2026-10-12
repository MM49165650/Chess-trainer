// One tactics puzzle: the opponent's setup move, the solver's first move, the
// opponent's reply and the solver's second move. A wrong move fails the
// puzzle, and the user may then retry or ask for the solution. Nothing is
// saved.

import { computed, onScopeDispose, ref } from 'vue';
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

/** The solver's moves in a puzzle. */
export const SOLVER_MOVE_COUNT = 2;

/**
 * - `setup`: the opponent's setup move is about to play by itself.
 * - `solve`: waiting for the user's move.
 * - `reply`: the opponent's reply is about to play by itself.
 * - `over`: the puzzle is solved, or its solution has been shown.
 */
export type PuzzleStatus = 'setup' | 'solve' | 'reply' | 'over';

export function useTacticsPuzzle(puzzle: PuzzleData) {
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

    /** True while the latest attempt at the move being asked for was wrong. */
    const lastAttemptWrong = ref(false);

    const solutionShown = ref(false);

    /** True once there is nothing left to solve. The arrows then work. */
    const over = ref(false);

    let timer: ReturnType<typeof setTimeout> | null = null;

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

    /** Decided by the first attempt, and known once the puzzle is over. */
    const outcome = computed<'solved' | 'failed' | null>(() => {
        if (!over.value) {
            return null;
        }

        return failed.value ? 'failed' : 'solved';
    });

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
            over.value = true;
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
        over.value = true;
        ply.value += 1;
    }

    // Once the puzzle is over, every position from before the setup move to
    // the final capture can be looked at.
    const canStepBack = computed(() => over.value && ply.value > 0);
    const canStepForward = computed(
        () => over.value && ply.value < line.length,
    );

    function stepBack(): void {
        if (canStepBack.value) {
            ply.value -= 1;
        }
    }

    function stepForward(): void {
        if (canStepForward.value) {
            ply.value += 1;
        }
    }

    playOpponentMove(SETUP_DELAY_MS);

    // The second argument keeps this quiet when there is no component.
    onScopeDispose(stopTimer, true);

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
        outcome,
        move,
        canShowSolution,
        showSolution,
        canStepBack,
        canStepForward,
        stepBack,
        stepForward,
    };
}
