// Tactics by piece: the puzzles whose result is decided, one record per
// puzzle whichever category it was played in, and the tallies per piece.

import { PIECE_TYPES, type PieceType } from '@/chess/conventions';
import { seenToClear, type Category } from '@/tactics/choose';
import { database, now } from './db';
import type { PuzzleSeen, TacticsTallies } from './types';

function emptyTallies(): TacticsTallies {
    const tallies = {} as TacticsTallies;

    for (const piece of PIECE_TYPES) {
        tallies[piece] = { attempts: 0, correct: 0 };
    }

    return tallies;
}

/** Every puzzle seen so far. Without storage there are none. */
export async function readPuzzlesSeen(): Promise<PuzzleSeen[]> {
    try {
        const db = await database();

        return (await db?.getAll('puzzlesSeen')) ?? [];
    } catch {
        return [];
    }
}

/** The tallies per piece, all at nought until something has been played. */
export async function readTacticsTallies(): Promise<TacticsTallies> {
    try {
        const db = await database();
        const saved = await db?.get('tacticsTallies', 'tallies');

        return { ...emptyTallies(), ...saved };
    } catch {
        return emptyTallies();
    }
}

/**
 * Records a puzzle's result, decided by the first attempt, and counts it in
 * the tally of the puzzle's own piece. A puzzle that is already recorded is
 * not counted again. The answer is whether it was saved.
 */
export async function recordPuzzleResult(
    puzzleId: number,
    piece: PieceType,
    solved: boolean,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction(
            ['puzzlesSeen', 'tacticsTallies'],
            'readwrite',
        );
        const seen = transaction.objectStore('puzzlesSeen');
        const tallies = transaction.objectStore('tacticsTallies');

        if ((await seen.get(puzzleId)) === undefined) {
            const saved = {
                ...emptyTallies(),
                ...(await tallies.get('tallies')),
            };
            const tally = saved[piece];

            saved[piece] = {
                attempts: tally.attempts + 1,
                correct: tally.correct + (solved ? 1 : 0),
            };

            await seen.put({ puzzleId, piece, solved, at: now() });
            await tallies.put(saved, 'tallies');
        }

        await transaction.done;

        return true;
    } catch {
        return false;
    }
}

/**
 * Forgets the seen puzzles of a category that has run out: one piece's, or
 * all of them for all pieces. The tallies are kept.
 */
export async function clearPuzzlesSeen(category: Category): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction('puzzlesSeen', 'readwrite');
        const ids = seenToClear(await transaction.store.getAll(), category);

        await Promise.all(ids.map((id) => transaction.store.delete(id)));
        await transaction.done;

        return true;
    } catch {
        return false;
    }
}
