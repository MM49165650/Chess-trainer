// Which practice game to serve next in a marking mode. The browser works it
// out by itself from the list of game IDs and the games already seen in
// that mode, so no game repeats until the mode has been through them all.

import type { MarkingMode } from './phases';

/** The stores that hold each mode's progress. The two never share one. */
export const STORES_OF = {
    squares: { session: 'squareSession', seen: 'squareSeen' },
    hanging: { session: 'hangingSession', seen: 'hangingSeen' },
} as const satisfies Record<MarkingMode, { session: string; seen: string }>;

export type GameChoice = {
    /** The game to serve, or null when there are no games at all. */
    id: number | null;
    /** True when the mode has run out, and its seen games are to be cleared. */
    reset: boolean;
};

/**
 * Picks a game at random from those not seen in the mode, never one of
 * `avoid`, which holds the game just played. When none is left, the mode
 * has run out: the pick is made from every game, still avoiding those, and
 * the seen games are to be cleared. With only one game, it is served again.
 */
export function chooseGame(
    ids: readonly number[],
    seen: ReadonlySet<number>,
    avoid: readonly number[],
    random: () => number = Math.random,
): GameChoice {
    const allowed = ids.filter((id) => !avoid.includes(id));
    const unseen = allowed.filter((id) => !seen.has(id));
    const reset = unseen.length === 0 && ids.length > 0;
    const pool =
        unseen.length > 0 ? unseen : allowed.length > 0 ? allowed : ids;

    return {
        id: pool[Math.floor(random() * pool.length)] ?? null,
        reset,
    };
}
