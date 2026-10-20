// Reset progress: every store except the settings and the meta record, and
// what the marking modes counted in memory during the visit.

import { database } from './db';
import { clearUnsavedScores, hasUnsavedScores } from './marking';

const PROGRESS_STORES = [
    'masterGames',
    'squareSession',
    'squareSeen',
    'squareTallies',
    'hangingSession',
    'hangingSeen',
    'hangingTallies',
    'puzzlesSeen',
    'tacticsTallies',
    'dailyTallies',
] as const;

/** Whether there is any progress to clear, stored or counted this visit. */
export async function hasProgress(): Promise<boolean> {
    if (hasUnsavedScores()) {
        return true;
    }

    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction(PROGRESS_STORES);
        const counts = await Promise.all(
            PROGRESS_STORES.map((name) =>
                transaction.objectStore(name).count(),
            ),
        );

        return counts.some((count) => count > 0);
    } catch {
        return false;
    }
}

/**
 * Clears all progress in one transaction, leaving the settings alone. The
 * answer is whether the stored progress was cleared.
 */
export async function resetProgress(): Promise<boolean> {
    clearUnsavedScores();

    try {
        const db = await database();

        if (db === null) {
            return true;
        }

        const transaction = db.transaction(PROGRESS_STORES, 'readwrite');

        await Promise.all([
            ...PROGRESS_STORES.map((name) =>
                transaction.objectStore(name).clear(),
            ),
            transaction.done,
        ]);

        return true;
    } catch {
        return false;
    }
}
