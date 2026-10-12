// The user's settings. Only the settings that have been chosen are stored;
// whoever reads one supplies its default.

import { database } from './db';
import type { Settings } from './types';

/** The settings chosen so far. Without storage there are none. */
export async function readSettings(): Promise<Partial<Settings>> {
    try {
        const db = await database();

        return (await db?.get('settings', 'settings')) ?? {};
    } catch {
        return {};
    }
}

/**
 * Saves some settings and leaves the others as they were. The answer is
 * whether they were saved.
 */
export async function saveSettings(
    changes: Partial<Settings>,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction('settings', 'readwrite');
        const saved = (await transaction.store.get('settings')) ?? {};

        await transaction.store.put({ ...saved, ...changes }, 'settings');
        await transaction.done;

        return true;
    } catch {
        return false;
    }
}
