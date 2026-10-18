// Opening a practice game by its number in a marking mode. The lists and
// sessions are made up for the test.

import { expect, test } from 'vitest';
import type { MarkingSession } from '@/storage/marking';
import { gameNumber, openByNumber } from './byNumber';
import { chooseGame, type GameListItem } from './choose';
import { MARKING_MODES } from './phases';
import { pointAfterOpening } from './useMarkingGame';

/** Five games, by their IDs and plies. */
const games: GameListItem[] = [
    [1, 30],
    [2, 49],
    [7, 50],
    [12, 73],
    [1234, 74],
];

/** Move 1 of a game, as every game opened by number starts. */
function atMoveOne(
    gameId: number,
    mode: (typeof MARKING_MODES)[number],
): MarkingSession {
    return {
        gameId,
        ply: 1,
        phase: mode === 'squares' ? 'lost' : 'hanging',
        rook: false,
        results: [],
    };
}

test.each(MARKING_MODES)(
    '%s: with no game in progress, a game opened by number starts at move 1',
    (mode) => {
        expect(openByNumber(mode, null, 7)).toEqual({
            session: atMoveOne(7, mode),
            abandon: null,
        });

        // The skipped opening does not apply: a pick with ten moves skipped
        // would start at ply 21.
        expect(pointAfterOpening(50, mode, 10).ply).toBe(21);
        expect(openByNumber(mode, null, 7).session.ply).toBe(1);
    },
);

test.each(MARKING_MODES)(
    '%s: opening a game by number leaves another game in progress as abandoned',
    (mode) => {
        const current: MarkingSession = {
            gameId: 12,
            ply: 17,
            phase: mode === 'squares' ? 'controlled' : 'hanging',
            rook: false,
            results: mode === 'squares' ? [true] : [],
        };

        expect(openByNumber(mode, current, 7)).toEqual({
            session: atMoveOne(7, mode),
            abandon: 12,
        });
    },
);

test.each(MARKING_MODES)(
    '%s: opening the game in progress by its number resumes it where it stands',
    (mode) => {
        const current: MarkingSession = {
            gameId: 7,
            ply: 17,
            phase: mode === 'squares' ? 'controlled' : 'hanging',
            rook: false,
            results: mode === 'squares' ? [false] : [],
        };

        expect(openByNumber(mode, current, 7)).toEqual({
            session: current,
            abandon: null,
        });
    },
);

test.each(MARKING_MODES)(
    '%s: a finished game opened by number is played again from move 1',
    (mode) => {
        // Game 7 was finished, so its session ended and it is seen: a random
        // pick no longer serves it, but its number still opens it.
        const seen = new Set([7]);

        for (let step = 0; step < 50; step += 1) {
            expect(
                chooseGame(games, 'any', seen, [], () => step / 50).id,
            ).not.toBe(7);
        }

        expect(openByNumber(mode, null, 7)).toEqual({
            session: atMoveOne(7, mode),
            abandon: null,
        });
    },
);

test('an unknown game number names no game', () => {
    expect(gameNumber(games, '1234')).toBe(1234);
    expect(gameNumber(games, ' 7 ')).toBe(7);
    expect(gameNumber(games, '007')).toBe(7);

    // Not in the list, or not a number at all.
    for (const typed of ['3', '0', '12345', '', '7a', '-7', '7.0', '1e3']) {
        expect(gameNumber(games, typed)).toBeNull();
    }

    expect(gameNumber([], '7')).toBeNull();
});
