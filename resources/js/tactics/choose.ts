// Which puzzles to serve, and in what order. The browser works this out by
// itself from the lists of puzzle IDs and what the user has already seen, so
// that no puzzle repeats until its category has run out.

import type { PieceType } from '@/chess/conventions';
import type { PuzzleIdListData } from '@/generated/data';

/** What is played: the puzzles of one piece, or of all six. */
export type Category = PieceType | 'all';

export type PuzzleEntry = { id: number; rating: number; piece: PieceType };

/** A puzzle whose result is decided. There is one record per puzzle. */
export type SeenPuzzle = { puzzleId: number; piece: PieceType };

/**
 * The unseen puzzles of the lists given, easiest first: by rating, and by
 * puzzle ID where ratings are equal. One list is one piece's category; all
 * six make the all pieces option, as a single list across the pieces.
 *
 * Seen puzzles are left out whichever category they were played in, so a
 * piece that has run out is passed over until every piece has.
 */
export function servingOrder(
    lists: readonly PuzzleIdListData[],
    seen: ReadonlySet<number>,
): PuzzleEntry[] {
    const entries: PuzzleEntry[] = [];

    for (const list of lists) {
        for (const [id, rating] of list.items) {
            if (!seen.has(id)) {
                entries.push({ id, rating, piece: list.piece });
            }
        }
    }

    return entries.sort((a, b) => a.rating - b.rating || a.id - b.id);
}

/**
 * The seen records to delete when a category has run out: that piece's
 * alone, or every record when all pieces has run out.
 */
export function seenToClear(
    seen: Iterable<SeenPuzzle>,
    category: Category,
): number[] {
    const ids: number[] = [];

    for (const record of seen) {
        if (category === 'all' || record.piece === category) {
            ids.push(record.puzzleId);
        }
    }

    return ids;
}
