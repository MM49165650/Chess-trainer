// The game lengths a marking mode can be asked for, and the opening it can
// skip. The bands are the three the practice games were chosen with at
// import (Appendix E), so the import and the browser share this one list.

/** The length bands, each with the longest game it holds, in plies. */
export const BANDS = [
    { name: 'short', upTo: 49 },
    { name: 'medium', upTo: 73 },
    { name: 'long', upTo: Infinity },
] as const;

export type BandName = (typeof BANDS)[number]['name'];

/** The band a game of this length belongs to. */
export function bandOf(plies: number): BandName {
    return BANDS.find((band) => plies <= band.upTo)?.name ?? 'long';
}

/** A choice of game length: one band, or any of them. */
export type GameLength = 'any' | BandName;

export const GAME_LENGTHS = [
    'any',
    'short',
    'medium',
    'long',
] as const satisfies readonly GameLength[];

/**
 * Each choice in full moves, the moves both sides have made. With the
 * import's limits of 30 and 120 plies the bands hold games of 15 to 24, 25
 * to 36 and 37 to 60 full moves.
 */
export const LENGTH_RANGES: Record<GameLength, string> = {
    any: '15–60 moves',
    short: '15–24 moves',
    medium: '25–36 moves',
    long: '37–60 moves',
};

/** Whether a game of this many plies is of the chosen length. */
export function isOfLength(plies: number, length: GameLength): boolean {
    return length === 'any' || bandOf(plies) === length;
}

/** The most full moves that can be skipped at the start of a game. */
export const SKIP_MOVES_MAX = 10;

/**
 * The first move worked on once the opening's full moves are skipped:
 * White's move after them. A game too short for that starts at its last
 * move, so there is always something to mark.
 */
export function firstPlyAfter(skipMoves: number, plyCount: number): number {
    return Math.max(1, Math.min(2 * skipMoves + 1, plyCount));
}
