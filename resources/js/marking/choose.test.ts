// Which practice game a marking mode serves next. The lists and seen games
// are made up for the test.

import { expect, test } from 'vitest';
import { chooseGame, STORES_OF, type GameListItem } from './choose';
import type { GameLength } from './lengths';

/** Five games: two short, two medium and one long, by their plies. */
const games: GameListItem[] = [
    [1, 30],
    [2, 49],
    [3, 50],
    [4, 73],
    [5, 74],
];

const ids = games.map(([id]) => id);

/** Every pick a choice could make, by trying each slice of the range. */
function possiblePicks(
    seen: readonly number[],
    avoid: readonly number[] = [],
    length: GameLength = 'any',
): number[] {
    const picks = new Set<number>();

    for (let step = 0; step < 50; step += 1) {
        const choice = chooseGame(
            games,
            length,
            new Set(seen),
            avoid,
            () => step / 50,
        );

        if (choice.id !== null) {
            picks.add(choice.id);
        }
    }

    return [...picks].sort((a, b) => a - b);
}

test('only games unseen in the mode are chosen', () => {
    expect(possiblePicks([2, 4])).toEqual([1, 3, 5]);
    expect(chooseGame(games, 'any', new Set([2, 4]), []).reset).toEqual([]);
});

test('the current game is never chosen again', () => {
    expect(possiblePicks([2], [3])).toEqual([1, 4, 5]);

    // Not even when it is the only game left unseen: the mode has then run
    // out, and another game is picked.
    expect(possiblePicks([1, 2, 4, 5], [3])).toEqual([1, 2, 4, 5]);
    expect(chooseGame(games, 'any', new Set([1, 2, 4, 5]), [3]).reset).toEqual(
        ids,
    );
});

test("each mode keeps its own seen games, so one mode's are no use to the other", () => {
    expect(STORES_OF.squares).toEqual({
        session: 'squareSession',
        seen: 'squareSeen',
    });
    expect(STORES_OF.hanging).toEqual({
        session: 'hangingSession',
        seen: 'hangingSeen',
    });

    // Every game finished in square control is still there to be chosen in
    // spot the hanging piece, whose seen games are its own.
    const seenInSquares = new Set(ids);
    const seenInHanging = new Set<number>();

    expect(chooseGame(games, 'any', seenInSquares, []).reset).toEqual(ids);
    expect(chooseGame(games, 'any', seenInHanging, []).reset).toEqual([]);
    expect(possiblePicks([...seenInHanging])).toEqual(ids);
});

test('a mode that has run out is reset, and serves every game again', () => {
    const choice = chooseGame(games, 'any', new Set(ids), [], () => 0.5);

    expect(choice).toEqual({ id: 3, reset: ids });
    expect(possiblePicks(ids)).toEqual(ids);
});

test('with no games there is nothing to choose, and nothing to reset', () => {
    expect(chooseGame([], 'any', new Set(), [])).toEqual({
        id: null,
        reset: [],
    });
});

test('a single game is served again once it has been seen', () => {
    expect(chooseGame([[7, 40]], 'any', new Set([7]), [7])).toEqual({
        id: 7,
        reset: [7],
    });
});

test('a game is picked from the chosen band only, at its edges as well', () => {
    expect(possiblePicks([], [], 'short')).toEqual([1, 2]);
    expect(possiblePicks([], [], 'medium')).toEqual([3, 4]);
    expect(possiblePicks([], [], 'long')).toEqual([5]);
    expect(possiblePicks([], [], 'any')).toEqual(ids);

    // Seen games and the current game are left out within the band.
    expect(possiblePicks([3], [], 'medium')).toEqual([4]);
    expect(possiblePicks([], [1], 'short')).toEqual([2]);
});

test('a band that has run out is reset by itself, and the others keep their seen games', () => {
    // Both medium games are seen, and so is a short one.
    const seen = new Set([1, 3, 4]);
    const medium = chooseGame(games, 'medium', seen, [], () => 0.9);

    expect(medium).toEqual({ id: 4, reset: [3, 4] });

    // Short has a game left, so nothing is reset there.
    expect(chooseGame(games, 'short', seen, [])).toEqual({ id: 2, reset: [] });

    // The game just played is still avoided after its band is reset.
    expect(chooseGame(games, 'medium', seen, [4])).toEqual({
        id: 3,
        reset: [3, 4],
    });
});

test('a band with no games has nothing to choose', () => {
    const shortOnly: GameListItem[] = [
        [1, 30],
        [2, 40],
    ];

    expect(chooseGame(shortOnly, 'long', new Set(), [])).toEqual({
        id: null,
        reset: [],
    });
});
