// Accuracy by master, for the progress page: correct guesses out of all
// guesses, over finished games only, using each game's latest finished
// result. Nothing new is stored; it is worked out from the game records.

import type { MasterGameRecord } from '@/storage/types';

/** A master as the progress page receives it, in the fixed order. */
export type MasterName = { slug: string; name: string };

export type MasterAccuracy = {
    slug: string;
    name: string;
    games: number;
    moves: number;
    correct: number;
    /** Rounded down, like the marking percentages. */
    percent: number;
};

/**
 * One row per master with a finished game, from highest accuracy to lowest.
 * Equal accuracy lists more moves first, then the fixed master order.
 */
export function accuracyByMaster(
    masters: readonly MasterName[],
    records: readonly MasterGameRecord[],
): MasterAccuracy[] {
    const rows: MasterAccuracy[] = [];

    for (const master of masters) {
        let games = 0;
        let moves = 0;
        let correct = 0;

        for (const record of records) {
            if (record.masterSlug === master.slug && record.finished !== null) {
                games += 1;
                moves += record.finished.total;
                correct += record.finished.correct;
            }
        }

        if (games > 0 && moves > 0) {
            rows.push({
                slug: master.slug,
                name: master.name,
                games,
                moves,
                correct,
                percent: Math.floor((correct * 100) / moves),
            });
        }
    }

    // A stable sort keeps the fixed master order for full ties.
    return rows.sort((a, b) => b.percent - a.percent || b.moves - a.moves);
}
