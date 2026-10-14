// Square control and spot the hanging piece: where the user is in each mode,
// and the practice games each mode has seen. Every mode keeps its own: the
// functions here are given the mode and touch only that mode's stores.

import type { Phase } from '@/chess/conventions';
import { STORES_OF } from '@/marking/choose';
import type { MarkingMode } from '@/marking/phases';
import { database, now } from './db';
import type { HangingSession, SquareSession } from './types';

/**
 * Where a session stands, the same in both modes: the next phase to
 * submit, and how the move's earlier phases scored.
 */
export type MarkingSession = {
    gameId: number;
    ply: number;
    phase: Phase;
    /** True on a castling move while the next phase is one of the rook's. */
    rook: boolean;
    results: boolean[];
};

function isSquarePhase(phase: Phase): phase is SquareSession['phase'] {
    return phase !== 'hanging';
}

/** The mode's session, or null when there is none or nothing is stored. */
export async function readSession(
    mode: MarkingMode,
): Promise<MarkingSession | null> {
    try {
        const db = await database();

        if (db === null) {
            return null;
        }

        if (mode === 'hanging') {
            const saved = await db.get('hangingSession', 'current');

            return saved === undefined
                ? null
                : {
                      gameId: saved.gameId,
                      ply: saved.ply,
                      phase: 'hanging',
                      rook: false,
                      results: [],
                  };
        }

        const saved = await db.get('squareSession', 'current');

        return saved === undefined
            ? null
            : {
                  gameId: saved.gameId,
                  ply: saved.ply,
                  phase: saved.phase,
                  rook: saved.rook,
                  results: saved.results,
              };
    } catch {
        return null;
    }
}

/** Saves where the mode's session stands. The answer is whether it was. */
export async function saveSession(
    mode: MarkingMode,
    session: MarkingSession,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        if (mode === 'hanging') {
            const record: HangingSession = {
                gameId: session.gameId,
                ply: session.ply,
                updatedAt: now(),
            };

            await db.put('hangingSession', record, 'current');

            return true;
        }

        if (!isSquarePhase(session.phase)) {
            return false;
        }

        const record: SquareSession = {
            gameId: session.gameId,
            ply: session.ply,
            phase: session.phase,
            rook: session.rook,
            results: session.results,
            updatedAt: now(),
        };

        await db.put('squareSession', record, 'current');

        return true;
    } catch {
        return false;
    }
}

/** Forgets the mode's session, as when its game cannot be played. */
export async function deleteSession(mode: MarkingMode): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        await db.delete(STORES_OF[mode].session, 'current');

        return true;
    } catch {
        return false;
    }
}

/**
 * Records a game as seen in the mode, finished or abandoned, and ends the
 * mode's session with it.
 */
export async function recordGameSeen(
    mode: MarkingMode,
    gameId: number,
    status: 'finished' | 'abandoned',
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const stores = STORES_OF[mode];
        const transaction = db.transaction(
            [stores.seen, stores.session],
            'readwrite',
        );

        await transaction
            .objectStore(stores.seen)
            .put({ gameId, status, at: now() });
        await transaction.objectStore(stores.session).delete('current');
        await transaction.done;

        return true;
    } catch {
        return false;
    }
}

/** The IDs of the games seen in the mode. Without storage there are none. */
export async function readSeenGames(mode: MarkingMode): Promise<number[]> {
    try {
        const db = await database();

        return (await db?.getAllKeys(STORES_OF[mode].seen)) ?? [];
    } catch {
        return [];
    }
}

/** Forgets the games seen in the mode, once it has been through them all. */
export async function clearSeenGames(mode: MarkingMode): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        await db.clear(STORES_OF[mode].seen);

        return true;
    } catch {
        return false;
    }
}
