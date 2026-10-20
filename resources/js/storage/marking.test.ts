// Results by day in the two marking modes, kept in a stand-in for the
// browser's database: saved with the running tallies or not at all, cleared
// by reset progress, added by the upgrade without touching what was stored,
// and counted for the visit when there is no storage. Everything stored is
// made up for the test.

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import type { MarkingSession } from './marking';

const NAME = 'chess-training';

/** A lost phase of a knight move, scored or not. */
function lost(exact: boolean) {
    return { phase: 'lost', piece: 'knight', exact } as const;
}

/** Where a square-control game goes after its first lost phase. */
const NEXT: Omit<MarkingSession, 'gameId'> = {
    ply: 1,
    phase: 'controlled',
    rook: false,
    results: [true],
};

/** The storage module afresh, with no database opened yet. */
async function storage() {
    return {
        marking: await import('./marking'),
        progress: await import('./progress'),
    };
}

/** A second look at what is stored, apart from the storage module. */
async function stored() {
    const db = await openDB(NAME);
    const contents = {
        version: db.version,
        stores: [...db.objectStoreNames],
        squareTallies: (await db.get('squareTallies', 'tallies')) as unknown,
        squareSession: (await db.get('squareSession', 'current')) as unknown,
        daily: (await db.getAll('dailyTallies')) as unknown,
    };

    db.close();

    return contents;
}

beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 19, 12));
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

test('a phase is counted in its tally and in its day together', async () => {
    const { marking } = await storage();

    // A week ago, in the seven before, and today, in the last seven days.
    vi.setSystemTime(new Date(2026, 9, 12, 12));
    expect(await marking.recordPhase('squares', 7, lost(false), NEXT)).toBe(
        true,
    );
    vi.setSystemTime(new Date(2026, 9, 19, 12));
    expect(await marking.recordPhase('squares', 7, lost(true), NEXT)).toBe(
        true,
    );

    const contents = await stored();

    expect(contents.daily).toEqual([
        {
            mode: 'squares',
            date: '2026-10-12',
            tallies: { lost: { attempts: 1, correct: 0 } },
        },
        {
            mode: 'squares',
            date: '2026-10-19',
            tallies: { lost: { attempts: 1, correct: 1 } },
        },
    ]);
    expect(await marking.readScores('squares')).toEqual([
        { phase: 'lost', tally: { attempts: 2, correct: 1 } },
        { phase: 'controlled', tally: { attempts: 0, correct: 0 } },
    ]);
    expect(await marking.readRecentScores('squares')).toEqual([
        {
            phase: 'lost',
            recent: { attempts: 1, correct: 1 },
            before: { attempts: 1, correct: 0 },
        },
        {
            phase: 'controlled',
            recent: { attempts: 0, correct: 0 },
            before: { attempts: 0, correct: 0 },
        },
    ]);
    // The other mode keeps its own days.
    expect(await marking.readRecentScores('hanging')).toEqual([
        {
            phase: 'hanging',
            recent: { attempts: 0, correct: 0 },
            before: { attempts: 0, correct: 0 },
        },
    ]);
});

test('a phase that cannot be saved leaves no tally and no day', async () => {
    const { marking } = await storage();

    // A session the database cannot store makes the last write fail, after
    // the tally and the day were written in the same transaction.
    const unstorable = {
        ...NEXT,
        results: [() => true] as unknown as boolean[],
    };

    expect(
        await marking.recordPhase('squares', 7, lost(true), unstorable),
    ).toBe(false);

    const contents = await stored();

    expect(contents.squareTallies).toBeUndefined();
    expect(contents.squareSession).toBeUndefined();
    expect(contents.daily).toEqual([]);
});

test('reset progress clears the results by day', async () => {
    const { marking, progress } = await storage();

    await marking.recordPhase(
        'hanging',
        7,
        { ...lost(true), phase: 'hanging' },
        null,
    );
    expect((await stored()).daily).toHaveLength(1);

    expect(await progress.resetProgress()).toBe(true);
    expect((await stored()).daily).toEqual([]);
    expect(await progress.hasProgress()).toBe(false);
    expect(await marking.readRecentScores('hanging')).toEqual([
        {
            phase: 'hanging',
            recent: { attempts: 0, correct: 0 },
            before: { attempts: 0, correct: 0 },
        },
    ]);
});

test('the upgrade adds the days and keeps the progress stored', async () => {
    // The database as version 2 left it, with some progress in it.
    const knight = { attempts: 5, correct: 3 };
    const none = { attempts: 0, correct: 0 };
    const squareTallies = {
        lost: {
            pawn: none,
            knight,
            bishop: none,
            rook: none,
            queen: none,
            king: none,
        },
        controlled: {
            pawn: none,
            knight: { attempts: 4, correct: 4 },
            bishop: none,
            rook: none,
            queen: none,
            king: none,
        },
    };
    const session = {
        gameId: 7,
        ply: 9,
        phase: 'controlled',
        rook: false,
        results: [true],
        updatedAt: '2026-10-18T10:00:00.000Z',
    };
    const old = await openDB(NAME, 2, {
        upgrade(db) {
            for (const name of [
                'meta',
                'settings',
                'squareSession',
                'squareTallies',
                'hangingSession',
                'hangingTallies',
                'tacticsTallies',
            ]) {
                db.createObjectStore(name);
            }

            db.createObjectStore('masterGames', { keyPath: 'gameId' });
            db.createObjectStore('squareSeen', { keyPath: 'gameId' });
            db.createObjectStore('hangingSeen', { keyPath: 'gameId' });
            db.createObjectStore('puzzlesSeen', { keyPath: 'puzzleId' });
        },
    });

    await old.put(
        'meta',
        { schemaVersion: 2, firstUsedAt: '2026-10-13T08:00:00.000Z' },
        'meta',
    );
    await old.put('squareTallies', squareTallies, 'tallies');
    await old.put('squareSession', session, 'current');
    await old.put('hangingTallies', { attempts: 10, correct: 6 }, 'tallies');
    old.close();

    const { marking } = await storage();

    expect(await marking.readScores('squares')).toEqual([
        { phase: 'lost', tally: knight },
        { phase: 'controlled', tally: { attempts: 4, correct: 4 } },
    ]);
    expect(await marking.readScores('hanging')).toEqual([
        { phase: 'hanging', tally: { attempts: 10, correct: 6 } },
    ]);
    expect(await marking.readSession('squares')).toMatchObject({
        gameId: 7,
        ply: 9,
    });

    const contents = await stored();

    expect(contents.version).toBe(3);
    expect(contents.stores).toContain('dailyTallies');
    expect(contents.squareTallies).toEqual(squareTallies);
    expect(contents.squareSession).toEqual(session);
    // Earlier play has no dates, so no day is made up for it.
    expect(contents.daily).toEqual([]);
});

test('without storage the days are counted for the visit', async () => {
    vi.stubGlobal('indexedDB', undefined);

    const { marking, progress } = await storage();
    const hanging = { ...lost(true), phase: 'hanging' } as const;

    expect(await marking.recordPhase('hanging', 7, hanging, null)).toBe(false);
    expect(
        await marking.recordPhase(
            'hanging',
            7,
            { ...hanging, exact: false },
            null,
        ),
    ).toBe(false);
    expect(await marking.readRecentScores('hanging')).toEqual([
        {
            phase: 'hanging',
            recent: { attempts: 2, correct: 1 },
            before: { attempts: 0, correct: 0 },
        },
    ]);

    await progress.resetProgress();
    expect(await marking.readRecentScores('hanging')).toEqual([
        {
            phase: 'hanging',
            recent: { attempts: 0, correct: 0 },
            before: { attempts: 0, correct: 0 },
        },
    ]);
});
