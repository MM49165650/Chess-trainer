// Results by day, and the two rolling windows they are compared in: the last
// seven days, today and the six before it, and the seven days before those.
// Days are dates in the browser's own time zone.

import type { Tally } from './types';

/** How many days each window holds. */
export const WINDOW_DAYS = 7;

/** A day's tally of one part of a mode, such as square control's lost phase. */
export type DayTally = { date: string; tally: Tally };

/** The two windows' totals of one part of a mode. */
export type WindowTotals = { recent: Tally; before: Tally };

function twoDigits(value: number): string {
    return String(value).padStart(2, '0');
}

/** The local date of a moment, as `2026-10-19`. */
export function localDate(moment: Date): string {
    return `${String(moment.getFullYear())}-${twoDigits(moment.getMonth() + 1)}-${twoDigits(moment.getDate())}`;
}

/**
 * The local date a number of days before a moment's. Counting in calendar
 * days keeps a day that is shorter or longer for a clock change one day.
 */
export function daysBefore(moment: Date, days: number): string {
    return localDate(
        new Date(
            moment.getFullYear(),
            moment.getMonth(),
            moment.getDate() - days,
        ),
    );
}

/** The first and last dates of the two windows, as of a moment. */
export function windowDates(moment: Date): {
    recent: { from: string; to: string };
    before: { from: string; to: string };
} {
    return {
        recent: {
            from: daysBefore(moment, WINDOW_DAYS - 1),
            to: localDate(moment),
        },
        before: {
            from: daysBefore(moment, 2 * WINDOW_DAYS - 1),
            to: daysBefore(moment, WINDOW_DAYS),
        },
    };
}

function add(a: Tally, b: Tally): Tally {
    return {
        attempts: a.attempts + b.attempts,
        correct: a.correct + b.correct,
    };
}

/**
 * The days' tallies totalled in each window, as of a moment. Days outside
 * both windows, earlier or later, are left out.
 */
export function windowTotals(
    days: readonly DayTally[],
    moment: Date,
): WindowTotals {
    const dates = windowDates(moment);
    const totals: WindowTotals = {
        recent: { attempts: 0, correct: 0 },
        before: { attempts: 0, correct: 0 },
    };

    for (const { date, tally } of days) {
        if (date >= dates.recent.from && date <= dates.recent.to) {
            totals.recent = add(totals.recent, tally);
        } else if (date >= dates.before.from && date <= dates.before.to) {
            totals.before = add(totals.before, tally);
        }
    }

    return totals;
}
