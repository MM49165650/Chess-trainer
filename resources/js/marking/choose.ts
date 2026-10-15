// Which practice game to serve next in a marking mode. The browser works it
// out by itself from the list of games and the games already seen in that
// mode, so no game of the chosen length repeats until the mode has been
// through them all.

import { isOfLength, type GameLength } from './lengths';
import type { MarkingMode } from './phases';

/** The stores that hold each mode's progress. The two never share one. */
export const STORES_OF = {
    squares: { session: 'squareSession', seen: 'squareSeen' },
    hanging: { session: 'hangingSession', seen: 'hangingSeen' },
} as const satisfies Record<MarkingMode, { session: string; seen: string }>;

/**
 * The settings that hold each mode's choices for the next game picked: its
 * length, and the full moves skipped at its start.
 */
export const CHOICES_OF = {
    squares: { length: 'squareLength', skipMoves: 'squareSkipMoves' },
    hanging: { length: 'hangingLength', skipMoves: 'hangingSkipMoves' },
} as const satisfies Record<MarkingMode, { length: string; skipMoves: string }>;

/** One practice game as the list gives it: its ID and its length in plies. */
export type GameListItem = readonly [id: number, plies: number];

export type GameChoice = {
    /** The game to serve, or null when there is no game of that length. */
    id: number | null;
    /**
     * The games whose seen records are to be cleared: every game of the
     * chosen length, once the mode has been through them all, and none
     * otherwise. Games of other lengths keep theirs.
     */
    reset: number[];
};

/**
 * Picks a game of the chosen length at random from those not seen in the
 * mode, never one of `avoid`, which holds the game just played. When none is
 * left, that length has run out: the pick is made from all its games, still
 * avoiding those, and their seen records are to be cleared. With only one
 * game of the length, it is served again.
 */
export function chooseGame(
    games: readonly GameListItem[],
    length: GameLength,
    seen: ReadonlySet<number>,
    avoid: readonly number[],
    random: () => number = Math.random,
): GameChoice {
    const ids = games
        .filter(([, plies]) => isOfLength(plies, length))
        .map(([id]) => id);
    const allowed = ids.filter((id) => !avoid.includes(id));
    const unseen = allowed.filter((id) => !seen.has(id));
    const runOut = unseen.length === 0 && ids.length > 0;
    const pool =
        unseen.length > 0 ? unseen : allowed.length > 0 ? allowed : ids;

    return {
        id: pool[Math.floor(random() * pool.length)] ?? null,
        reset: runOut ? ids : [],
    };
}
