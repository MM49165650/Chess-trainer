// The running scores of the two marking modes: one per phase, totalled
// across the pieces. Square control shows lost and controlled, and spot the
// hanging piece its one phase.

import type { Phase } from '@/chess/conventions';
import type { Tally } from '@/storage/types';
import type { MarkingMode } from './phases';

/** A phase's running score, as shown under the board and on the landing page. */
export type RunningScore = { phase: Phase; tally: Tally };

/** The phases each mode shows a percentage for, in their order. */
export const SCORED_PHASES: Readonly<Record<MarkingMode, readonly Phase[]>> = {
    squares: ['lost', 'controlled'],
    hanging: ['hanging'],
};

/** The mode's scores with nothing counted yet. */
export function emptyScores(mode: MarkingMode): RunningScore[] {
    return SCORED_PHASES[mode].map((phase) => ({
        phase,
        tally: { attempts: 0, correct: 0 },
    }));
}

/** The tally with one more phase counted. */
export function counted(tally: Tally, exact: boolean): Tally {
    return {
        attempts: tally.attempts + 1,
        correct: tally.correct + (exact ? 1 : 0),
    };
}

/** The scores with a phase that has ended counted in its own phase. */
export function withPhase(
    scores: readonly RunningScore[],
    phase: Phase,
    exact: boolean,
): RunningScore[] {
    return scores.map((score) =>
        score.phase === phase
            ? { phase, tally: counted(score.tally, exact) }
            : score,
    );
}

/**
 * A tally as a percentage, rounded down, so 100% shows only when every
 * counted phase scored. A dash until something has been counted.
 */
export function percentage(tally: Tally): string {
    if (tally.attempts === 0) {
        return '—';
    }

    return `${String(Math.floor((tally.correct * 100) / tally.attempts))}%`;
}
