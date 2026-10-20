// The two rolling windows of results by day, and the fewest phases a
// window needs before its percentage shows. The days are made up.

import { expect, test } from 'vitest';
import { WINDOW_MINIMUM, windowPercentage } from '@/marking/tallies';
import { localDate, windowTotals, type DayTally } from './days';

/** Midday on 19 October 2026, in the time zone the test runs in. */
const today = new Date(2026, 9, 19, 12);

/** A day with one phase counted, scored or not. */
function day(date: string, correct: boolean): DayTally {
    return { date, tally: { attempts: 1, correct: correct ? 1 : 0 } };
}

test('a day is its local date', () => {
    expect(localDate(today)).toBe('2026-10-19');
    expect(localDate(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
    expect(localDate(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
});

test('the last seven days are today and the six before it', () => {
    const totals = windowTotals(
        [day('2026-10-19', true), day('2026-10-13', false)],
        today,
    );

    expect(totals.recent).toEqual({ attempts: 2, correct: 1 });
    expect(totals.before).toEqual({ attempts: 0, correct: 0 });
});

test('the seven before are the seven days before those', () => {
    const totals = windowTotals(
        [day('2026-10-12', true), day('2026-10-06', true)],
        today,
    );

    expect(totals.recent).toEqual({ attempts: 0, correct: 0 });
    expect(totals.before).toEqual({ attempts: 2, correct: 2 });
});

test('a day just outside the windows counts in neither', () => {
    const totals = windowTotals(
        [day('2026-10-05', true), day('2026-10-20', true)],
        today,
    );

    expect(totals.recent).toEqual({ attempts: 0, correct: 0 });
    expect(totals.before).toEqual({ attempts: 0, correct: 0 });
});

test('the windows count calendar days across a month end', () => {
    const totals = windowTotals(
        [day('2026-10-28', true), day('2026-11-03', true)],
        new Date(2026, 10, 3, 12),
    );

    expect(totals.recent).toEqual({ attempts: 2, correct: 2 });
});

test('a window shows a percentage only from the minimum of phases', () => {
    expect(WINDOW_MINIMUM).toBe(20);
    expect(windowPercentage({ attempts: 0, correct: 0 })).toBe('—');
    expect(windowPercentage({ attempts: 19, correct: 19 })).toBe('—');
    expect(windowPercentage({ attempts: 20, correct: 14 })).toBe('70%');
    // Rounded down, as the running percentages are: 13 of 21 is 61.9%.
    expect(windowPercentage({ attempts: 21, correct: 13 })).toBe('61%');
});
