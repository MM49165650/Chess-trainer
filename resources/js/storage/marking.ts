// Square control and spot the hanging piece: where the user is in each mode,
// the practice games each mode has seen, and its tallies. Every mode keeps
// its own: the functions here are given the mode and touch only that mode's
// stores.

import { PIECE_TYPES, type Phase, type PieceType } from '@/chess/conventions';
import { STORES_OF } from '@/marking/choose';
import type { MarkingMode } from '@/marking/phases';
import {
    SCORED_PHASES,
    counted,
    emptyScores,
    withPhase,
    type RunningScore,
} from '@/marking/tallies';
import {
    localDate,
    windowDates,
    windowTotals,
    type DayTally,
    type WindowTotals,
} from './days';
import { database, now, type Database } from './db';
import type {
    DailyTallies,
    HangingSession,
    SquarePhase,
    SquareSession,
    SquareTallies,
    Tally,
} from './types';

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

/** A phase that has ended, as it counts towards the mode's tallies. */
export type EndedPhase = {
    phase: Phase;
    /** The piece that moved, or the rook in the rook's two phases. */
    piece: PieceType;
    exact: boolean;
};

function isSquarePhase(phase: Phase): phase is SquarePhase {
    return phase !== 'hanging';
}

const NOTHING: Tally = { attempts: 0, correct: 0 };

function add(a: Tally, b: Tally): Tally {
    return {
        attempts: a.attempts + b.attempts,
        correct: a.correct + b.correct,
    };
}

/**
 * The phases counted during this visit that could not be saved, as when
 * storage is unavailable. They count until the page is reloaded.
 */
const unsaved: Record<MarkingMode, RunningScore[]> = {
    squares: emptyScores('squares'),
    hanging: emptyScores('hanging'),
};

/** The same phases by day, by local date. */
const unsavedDays: Record<MarkingMode, Map<string, DailyTallies['tallies']>> = {
    squares: new Map(),
    hanging: new Map(),
};

/** A day's tallies with one more phase counted in its own phase. */
function dayCounted(
    saved: DailyTallies['tallies'] | undefined,
    ended: EndedPhase,
): DailyTallies['tallies'] {
    return {
        ...saved,
        [ended.phase]: counted(saved?.[ended.phase] ?? NOTHING, ended.exact),
    };
}

/** Square control's tallies as stored, with every phase and piece filled in. */
function filledSquareTallies(saved: SquareTallies | undefined): SquareTallies {
    const tallies = {} as SquareTallies;

    for (const phase of ['lost', 'controlled'] as const) {
        tallies[phase] = {} as SquareTallies[SquarePhase];

        for (const piece of PIECE_TYPES) {
            tallies[phase][piece] = saved?.[phase][piece] ?? NOTHING;
        }
    }

    return tallies;
}

async function storedScores(
    db: Database,
    mode: MarkingMode,
): Promise<RunningScore[]> {
    if (mode === 'hanging') {
        const saved = await db.get('hangingTallies', 'tallies');

        return [{ phase: 'hanging', tally: saved ?? NOTHING }];
    }

    const tallies = filledSquareTallies(
        await db.get('squareTallies', 'tallies'),
    );

    // The percentage shown for a phase is the total across the pieces.
    return emptyScores(mode).map(({ phase }) => ({
        phase,
        tally: isSquarePhase(phase)
            ? PIECE_TYPES.reduce(
                  (total, piece) => add(total, tallies[phase][piece]),
                  NOTHING,
              )
            : NOTHING,
    }));
}

/**
 * The mode's running score per phase: what is stored, and what this visit
 * counted but could not save.
 */
export async function readScores(mode: MarkingMode): Promise<RunningScore[]> {
    let stored = emptyScores(mode);

    try {
        const db = await database();

        if (db !== null) {
            stored = await storedScores(db, mode);
        }
    } catch {
        // Nothing stored can be read; the visit's own count still shows.
    }

    return stored.map((score, index) => ({
        phase: score.phase,
        tally: add(score.tally, unsaved[mode][index]?.tally ?? NOTHING),
    }));
}

/** A phase's totals in the last seven days and the seven before. */
export type RecentScore = { phase: Phase } & WindowTotals;

/**
 * The mode's totals per phase in the last seven days and the seven before,
 * as of a moment: what is stored by day, and what this visit counted but
 * could not save.
 */
export async function readRecentScores(
    mode: MarkingMode,
    moment: Date = new Date(),
): Promise<RecentScore[]> {
    const dates = windowDates(moment);
    const days: Pick<DailyTallies, 'date' | 'tallies'>[] = [
        ...unsavedDays[mode].entries(),
    ].map(([date, tallies]) => ({ date, tallies }));

    try {
        const db = await database();

        if (db !== null) {
            days.push(
                ...(await db.getAll(
                    'dailyTallies',
                    IDBKeyRange.bound(
                        [mode, dates.before.from],
                        [mode, dates.recent.to],
                    ),
                )),
            );
        }
    } catch {
        // Nothing stored can be read; the visit's own count still shows.
    }

    return SCORED_PHASES[mode].map((phase) => ({
        phase,
        ...windowTotals(
            days.flatMap(({ date, tallies }): DayTally[] => {
                const tally = tallies[phase];

                return tally === undefined ? [] : [{ date, tally }];
            }),
            moment,
        ),
    }));
}

/**
 * Counts a phase that has ended, in the mode's tallies and in today's
 * results, and saves where the game goes next, in one transaction, so that
 * either all of it is saved or none is. When `next` is null the game is
 * over: it is recorded as finished and the session ends. A phase that could
 * not be saved is still counted for the visit. The answer is whether it was
 * saved.
 */
export async function recordPhase(
    mode: MarkingMode,
    gameId: number,
    ended: EndedPhase,
    next: Omit<MarkingSession, 'gameId'> | null,
): Promise<boolean> {
    const date = localDate(new Date());
    const saved = await savePhase(mode, gameId, ended, next, date);

    if (!saved) {
        const days = unsavedDays[mode];

        unsaved[mode] = withPhase(unsaved[mode], ended.phase, ended.exact);
        days.set(date, dayCounted(days.get(date), ended));
    }

    return saved;
}

/**
 * Makes the writes in a transaction and waits for it to be saved. A write
 * that throws, rather than failing in the database, would otherwise leave
 * the writes before it to be saved, so the transaction is then abandoned
 * and nothing in it is kept.
 */
async function allOrNothing(
    transaction: { done: Promise<void>; abort: () => void },
    writes: () => Promise<void>,
): Promise<void> {
    try {
        await writes();
        await transaction.done;
    } catch (error) {
        // Abandoning it makes `done` fail too, which is expected here.
        transaction.done.catch(() => undefined);

        try {
            transaction.abort();
        } catch {
            // It had already ended without saving.
        }

        throw error;
    }
}

async function savePhase(
    mode: MarkingMode,
    gameId: number,
    ended: EndedPhase,
    next: Omit<MarkingSession, 'gameId'> | null,
    date: string,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        if (mode === 'hanging') {
            const transaction = db.transaction(
                [
                    'hangingTallies',
                    'dailyTallies',
                    'hangingSession',
                    'hangingSeen',
                ],
                'readwrite',
            );
            const tallies = transaction.objectStore('hangingTallies');
            const daily = transaction.objectStore('dailyTallies');
            const session = transaction.objectStore('hangingSession');

            await allOrNothing(transaction, async () => {
                await tallies.put(
                    counted(
                        (await tallies.get('tallies')) ?? NOTHING,
                        ended.exact,
                    ),
                    'tallies',
                );
                await daily.put({
                    mode,
                    date,
                    tallies: dayCounted(
                        (await daily.get([mode, date]))?.tallies,
                        ended,
                    ),
                });

                if (next === null) {
                    await transaction
                        .objectStore('hangingSeen')
                        .put({ gameId, status: 'finished', at: now() });
                    await session.delete('current');
                } else {
                    await session.put(
                        { gameId, ply: next.ply, updatedAt: now() },
                        'current',
                    );
                }
            });

            return true;
        }

        const phase = ended.phase;

        if (
            !isSquarePhase(phase) ||
            (next !== null && !isSquarePhase(next.phase))
        ) {
            return false;
        }

        const transaction = db.transaction(
            ['squareTallies', 'dailyTallies', 'squareSession', 'squareSeen'],
            'readwrite',
        );
        const tallies = transaction.objectStore('squareTallies');
        const daily = transaction.objectStore('dailyTallies');
        const session = transaction.objectStore('squareSession');

        await allOrNothing(transaction, async () => {
            const updated = filledSquareTallies(await tallies.get('tallies'));

            updated[phase][ended.piece] = counted(
                updated[phase][ended.piece],
                ended.exact,
            );

            await tallies.put(updated, 'tallies');
            await daily.put({
                mode,
                date,
                tallies: dayCounted(
                    (await daily.get([mode, date]))?.tallies,
                    ended,
                ),
            });

            if (next === null) {
                await transaction
                    .objectStore('squareSeen')
                    .put({ gameId, status: 'finished', at: now() });
                await session.delete('current');
            } else if (isSquarePhase(next.phase)) {
                await session.put(
                    {
                        gameId,
                        ply: next.ply,
                        phase: next.phase,
                        rook: next.rook,
                        results: next.results,
                        updatedAt: now(),
                    },
                    'current',
                );
            }
        });

        return true;
    } catch {
        return false;
    }
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

/**
 * Forgets that these games were seen in the mode, once it has been through
 * every game of a length. The mode's other seen games are kept.
 */
export async function clearSeenGames(
    mode: MarkingMode,
    gameIds: readonly number[],
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction(STORES_OF[mode].seen, 'readwrite');

        await Promise.all([
            ...gameIds.map((gameId) => transaction.store.delete(gameId)),
            transaction.done,
        ]);

        return true;
    } catch {
        return false;
    }
}

/** Whether either mode has counted a phase this visit that was not saved. */
export function hasUnsavedScores(): boolean {
    return Object.values(unsaved).some((scores) =>
        scores.some((score) => score.tally.attempts > 0),
    );
}

/** Forgets what either mode counted this visit without saving it. */
export function clearUnsavedScores(): void {
    unsaved.squares = emptyScores('squares');
    unsaved.hanging = emptyScores('hanging');
    unsavedDays.squares.clear();
    unsavedDays.hanging.clear();
}
