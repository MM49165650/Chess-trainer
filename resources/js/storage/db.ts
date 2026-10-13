// The one IndexedDB database that holds the user's progress and settings:
// Appendix G of docs/requirements.md. Pages never use IndexedDB directly;
// they go through the functions in this folder.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
    HangingSeen,
    HangingSession,
    HangingTally,
    MasterGameRecord,
    Meta,
    PuzzleSeen,
    Settings,
    SquareSeen,
    SquareSession,
    SquareTallies,
    TacticsTallies,
} from './types';

/** The database's name until the site has one. */
const NAME = 'chess-training';

/**
 * A change to the structure raises this number and adds an upgrade step
 * below. Stores are never deleted to make a change.
 */
const VERSION = 2;

interface Schema extends DBSchema {
    meta: { key: 'meta'; value: Meta };
    // Only the settings that have been chosen are stored.
    settings: { key: 'settings'; value: Partial<Settings> };
    masterGames: { key: number; value: MasterGameRecord };
    squareSession: { key: 'current'; value: SquareSession };
    squareSeen: { key: number; value: SquareSeen };
    squareTallies: { key: 'tallies'; value: SquareTallies };
    hangingSession: { key: 'current'; value: HangingSession };
    hangingSeen: { key: number; value: HangingSeen };
    hangingTallies: { key: 'tallies'; value: HangingTally };
    puzzlesSeen: { key: number; value: PuzzleSeen };
    tacticsTallies: { key: 'tallies'; value: TacticsTallies };
}

export type Database = IDBPDatabase<Schema>;

/** The current time as stored: ISO 8601 text in UTC. */
export function now(): string {
    return new Date().toISOString();
}

// On first use, the date is noted and the browser is asked to keep the data
// rather than clear it when space runs short.
async function noteFirstUse(db: Database): Promise<void> {
    const meta = await db.get('meta', 'meta');

    if (meta !== undefined) {
        // After an upgrade the noted version follows the database's.
        if (meta.schemaVersion !== VERSION) {
            await db.put('meta', { ...meta, schemaVersion: VERSION }, 'meta');
        }

        return;
    }

    await db.put(
        'meta',
        { schemaVersion: VERSION, firstUsedAt: now() },
        'meta',
    );

    if ('storage' in navigator && 'persist' in navigator.storage) {
        void navigator.storage.persist().catch(() => false);
    }
}

async function open(): Promise<Database | null> {
    try {
        const db = await openDB<Schema>(NAME, VERSION, {
            upgrade(upgrading, oldVersion) {
                if (oldVersion < 1) {
                    upgrading.createObjectStore('meta');
                    upgrading.createObjectStore('settings');
                    upgrading.createObjectStore('masterGames', {
                        keyPath: 'gameId',
                    });
                    upgrading.createObjectStore('squareSession');
                    upgrading.createObjectStore('squareSeen', {
                        keyPath: 'gameId',
                    });
                    upgrading.createObjectStore('squareTallies');
                    upgrading.createObjectStore('puzzlesSeen', {
                        keyPath: 'puzzleId',
                    });
                    upgrading.createObjectStore('tacticsTallies');
                }

                // Spot the hanging piece became a mode of its own, with its
                // own progress.
                if (oldVersion < 2) {
                    upgrading.createObjectStore('hangingSession');
                    upgrading.createObjectStore('hangingSeen', {
                        keyPath: 'gameId',
                    });
                    upgrading.createObjectStore('hangingTallies');
                }
            },
        });

        await noteFirstUse(db);

        return db;
    } catch {
        // Some private browsing modes have no storage. The site still works
        // for the visit; nothing is saved.
        return null;
    }
}

let opening: Promise<Database | null> | null = null;

/** The open database, or null when the browser has no storage to offer. */
export function database(): Promise<Database | null> {
    opening ??= open();

    return opening;
}

/** Whether progress can be saved in this browser. */
export async function storageAvailable(): Promise<boolean> {
    return (await database()) !== null;
}
