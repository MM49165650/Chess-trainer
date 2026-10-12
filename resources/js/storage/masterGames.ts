// Guess the move: one record per master game started, holding the attempt
// in progress and the last finished result.

import { database, now } from './db';
import type { Guess, MasterGameRecord } from './types';

/** The saved record for a game, or null when it has not been started. */
export async function readMasterGame(
    gameId: number,
): Promise<MasterGameRecord | null> {
    try {
        const db = await database();

        return (await db?.get('masterGames', gameId)) ?? null;
    } catch {
        return null;
    }
}

// Reads a game's record, or makes an empty one, changes it and writes it
// back, all in one transaction. The answer is whether it was saved.
async function change(
    gameId: number,
    masterSlug: string,
    apply: (record: MasterGameRecord) => void,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction('masterGames', 'readwrite');
        const record = (await transaction.store.get(gameId)) ?? {
            gameId,
            masterSlug,
            finished: null,
            current: null,
        };

        apply(record);
        await transaction.store.put(record);
        await transaction.done;

        return true;
    } catch {
        return false;
    }
}

/**
 * Saves the attempt in progress. The last finished result is left alone, so
 * the earlier score stands until a replay ends.
 */
export function saveMasterGameProgress(
    gameId: number,
    masterSlug: string,
    guesses: readonly Guess[],
): Promise<boolean> {
    // Copied now, so a later guess cannot slip into this write.
    const copy = guesses.map((guess) => ({ ...guess }));
    const at = now();

    return change(gameId, masterSlug, (record) => {
        record.current = {
            guesses: copy,
            startedAt: record.current?.startedAt ?? at,
            updatedAt: at,
        };
    });
}

/** Saves a completed attempt in place of the last one, and ends the attempt. */
export function saveMasterGameResult(
    gameId: number,
    masterSlug: string,
    guesses: readonly Guess[],
): Promise<boolean> {
    const copy = guesses.map((guess) => ({ ...guess }));

    return change(gameId, masterSlug, (record) => {
        record.finished = {
            correct: copy.filter((guess) => guess.correct).length,
            total: copy.length,
            guesses: copy,
            finishedAt: now(),
        };
        record.current = null;
    });
}

/**
 * The saved records for some games, by game ID, for a list that shows scores
 * and in-progress markers. Games that were never started are left out.
 */
export async function readMasterGames(
    gameIds: readonly number[],
): Promise<Map<number, MasterGameRecord>> {
    const records = new Map<number, MasterGameRecord>();

    try {
        const db = await database();

        if (db === null) {
            return records;
        }

        const transaction = db.transaction('masterGames');
        const found = await Promise.all(
            gameIds.map((gameId) => transaction.store.get(gameId)),
        );

        for (const record of found) {
            if (record !== undefined) {
                records.set(record.gameId, record);
            }
        }
    } catch {
        // Without storage the list simply shows no scores.
    }

    return records;
}
