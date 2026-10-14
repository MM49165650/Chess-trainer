// One game of guess the move: whose turn it is, what the user has guessed and
// the running score. Every guess is saved, so a game resumes where it was left.
// The user can also look back over the moves already played.

import { computed, onBeforeUnmount, ref, type Ref } from 'vue';
import {
    colorOfPly,
    formatMove,
    movesEqual,
    parseMove,
    type MoveParts,
} from '@/chess/conventions';
import { positionsOf, writtenMove } from '@/chess/game';
import type { MasterGameData } from '@/generated/data';
import {
    saveMasterGameProgress,
    saveMasterGameResult,
} from '@/storage/masterGames';
import type { Guess, MasterGameRecord } from '@/storage/types';

/** The outcome of the latest guess, kept on screen until the next one. */
export type GuessResult = {
    /** Which of the master's moves it was, counting from 1. */
    number: number;
    correct: boolean;
    /** The user's move, written out. */
    guessed: string;
    /** The move the master played. */
    played: { uci: string; san: string };
};

/** An earlier position being looked at, in place of the current one. */
export type ViewedMove = {
    /** How many plies had been played in the position shown. */
    ply: number;
    /** The move that led to it, or null at the start of the game. */
    played: { uci: string; san: string } | null;
    byMaster: boolean;
    /** The user's guess at that move, when it was the master's. */
    result: GuessResult | null;
};

/**
 * - `opponent`: the opponent's move is about to play by itself.
 * - `guess`: waiting for the user to guess the master's move.
 * - `over`: the last move has been played.
 */
export type GuessStatus = 'opponent' | 'guess' | 'over';

/**
 * `saved` is the game's record from an earlier visit, if any, and
 * `canSave` is whether the browser has storage to save this one in.
 */
export function useGuessGame(
    game: MasterGameData,
    delaySeconds: Ref<number>,
    saved: MasterGameRecord | null,
    canSave: boolean,
) {
    const positions = positionsOf(game.moves);

    /** True once progress is known not to be reaching storage. */
    const notSaved = ref(!canSave);

    /** How many plies have been played on the board so far. */
    const ply = ref(0);
    const guesses = ref<Guess[]>([]);
    const result = ref<GuessResult | null>(null);

    /**
     * True from a guess until the opponent has replied. The result is the
     * headline during that time, and a smaller line under the question after.
     */
    const resultIsFresh = ref(false);

    /** Whole seconds until the opponent's move plays, while it is pending. */
    const secondsLeft = ref(0);

    /**
     * The earlier position being looked at, as a number of plies, or null
     * when the board shows the current position. It is never past `ply`,
     * so looking back cannot show a move still to be guessed.
     */
    const viewedPly = ref<number | null>(null);

    const shownPly = computed(() => viewedPly.value ?? ply.value);

    let timer: ReturnType<typeof setInterval> | null = null;

    const status = computed<GuessStatus>(() => {
        if (ply.value >= game.moves.length) {
            return 'over';
        }

        return colorOfPly(ply.value + 1) === game.master_color
            ? 'guess'
            : 'opponent';
    });

    const fen = computed(() => positions[shownPly.value] ?? '');

    const lastMove = computed<MoveParts | null>(() => {
        const played = game.moves[shownPly.value - 1];

        return played ? parseMove(played.uci) : null;
    });

    const correctCount = computed(
        () => guesses.value.filter((guess) => guess.correct).length,
    );

    function stopTimer(): void {
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Plays the opponent's move after the delay the user has set.
    function scheduleOpponent(): void {
        stopTimer();

        if (status.value !== 'opponent') {
            return;
        }

        secondsLeft.value = delaySeconds.value;

        timer = setInterval(() => {
            // The reply waits while an earlier position is being looked at.
            if (viewedPly.value !== null) {
                return;
            }

            secondsLeft.value -= 1;

            if (secondsLeft.value <= 0) {
                stopTimer();
                ply.value += 1;
                resultIsFresh.value = false;
            }
        }, 1000);
    }

    /** One attempt per move: right or wrong, the master's move is played. */
    function guess(move: MoveParts): void {
        const played = game.moves[ply.value];
        const position = positions[ply.value];
        const expected = played ? parseMove(played.uci) : null;

        if (
            status.value !== 'guess' ||
            viewedPly.value !== null ||
            played === undefined ||
            position === undefined ||
            expected === null
        ) {
            return;
        }

        const correct = movesEqual(move, expected);

        guesses.value.push({ uci: formatMove(move), correct });
        result.value = {
            number: guesses.value.length,
            correct,
            guessed: writtenMove(position, move) ?? played.san,
            played,
        };
        resultIsFresh.value = true;
        ply.value += 1;

        // A game counts as started at its first guess, and as finished at
        // its last one, even while the opponent's final move is pending.
        const save =
            guesses.value.length >= game.guess_count
                ? saveMasterGameResult
                : saveMasterGameProgress;

        void save(game.id, game.master.slug, guesses.value).then((done) => {
            if (!done) {
                notSaved.value = true;
            }
        });

        scheduleOpponent();
    }

    /** The ply of one of the master's moves, counting those from 1. */
    function plyOfGuess(number: number): number {
        return game.master_color === 'white' ? number * 2 - 1 : number * 2;
    }

    /** The outcome of a guess already made, by the number of the move. */
    function resultOf(number: number): GuessResult | null {
        const at = plyOfGuess(number);
        const made = guesses.value[number - 1];
        const played = game.moves[at - 1];
        const position = positions[at - 1];
        const move = made ? parseMove(made.uci) : null;

        if (!made || !played || position === undefined || !move) {
            return null;
        }

        return {
            number,
            correct: made.correct,
            guessed: writtenMove(position, move) ?? made.uci,
            played,
        };
    }

    // Picks up an attempt where it was left: the opponent's reply to the
    // last guess is already on the board, and that guess's result is shown.
    function resume(earlier: readonly Guess[]): void {
        guesses.value = earlier.map((guess) => ({ ...guess }));
        ply.value = Math.min(plyOfGuess(earlier.length) + 1, game.moves.length);
        result.value = resultOf(earlier.length);
    }

    const viewed = computed<ViewedMove | null>(() => {
        const at = viewedPly.value;

        if (at === null) {
            return null;
        }

        const byMaster = at > 0 && colorOfPly(at) === game.master_color;
        const number = game.master_color === 'white' ? (at + 1) / 2 : at / 2;

        return {
            ply: at,
            played: game.moves[at - 1] ?? null,
            byMaster,
            result: byMaster ? resultOf(number) : null,
        };
    });

    /** How many of the master's moves are on the board as it is shown. */
    const shownGuessCount = computed(() =>
        game.master_color === 'white'
            ? Math.ceil(shownPly.value / 2)
            : Math.floor(shownPly.value / 2),
    );

    const canStepBack = computed(() => shownPly.value > 0);
    const canStepForward = computed(() => viewedPly.value !== null);

    function stepBack(): void {
        if (canStepBack.value) {
            viewedPly.value = shownPly.value - 1;
        }
    }

    /** Back to the current position, where the game carries on. */
    function returnToGame(): void {
        viewedPly.value = null;
    }

    function stepForward(): void {
        if (viewedPly.value === null) {
            return;
        }

        if (viewedPly.value + 1 >= ply.value) {
            returnToGame();
        } else {
            viewedPly.value += 1;
        }
    }

    function viewFromStart(): void {
        if (ply.value > 0) {
            viewedPly.value = 0;
        }
    }

    // A finished game opens on its final position with the saved score.
    function showFinished(earlier: readonly Guess[]): void {
        guesses.value = earlier.map((guess) => ({ ...guess }));
        ply.value = game.moves.length;
    }

    function restart(): void {
        stopTimer();
        viewedPly.value = null;
        ply.value = 0;
        guesses.value = [];
        result.value = null;
        resultIsFresh.value = false;

        // When the master has Black, White's first move plays by itself.
        scheduleOpponent();
    }

    const inProgress = saved?.current?.guesses ?? [];

    if (inProgress.length > 0 && inProgress.length < game.guess_count) {
        resume(inProgress);
    } else if (saved?.finished) {
        showFinished(saved.finished.guesses);
    } else {
        restart();
    }

    onBeforeUnmount(stopTimer);

    return {
        ply,
        shownPly,
        viewed,
        shownGuessCount,
        canStepBack,
        canStepForward,
        stepBack,
        stepForward,
        returnToGame,
        viewFromStart,
        fen,
        lastMove,
        status,
        guesses,
        correctCount,
        result,
        resultIsFresh,
        secondsLeft,
        notSaved,
        guess,
        restart,
    };
}
