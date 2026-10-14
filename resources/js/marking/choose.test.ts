// Which practice game a marking mode serves next. The lists and seen games
// are made up for the test.

import { expect, test } from 'vitest';
import { chooseGame, STORES_OF } from './choose';

const ids = [1, 2, 3, 4, 5];

/** Every pick a choice could make, by trying each slice of the range. */
function possiblePicks(
    seen: readonly number[],
    avoid: readonly number[] = [],
): number[] {
    const picks = new Set<number>();

    for (let step = 0; step < 50; step += 1) {
        const choice = chooseGame(ids, new Set(seen), avoid, () => step / 50);

        if (choice.id !== null) {
            picks.add(choice.id);
        }
    }

    return [...picks].sort((a, b) => a - b);
}

test('only games unseen in the mode are chosen', () => {
    expect(possiblePicks([2, 4])).toEqual([1, 3, 5]);
    expect(chooseGame(ids, new Set([2, 4]), []).reset).toBe(false);
});

test('the current game is never chosen again', () => {
    expect(possiblePicks([2], [3])).toEqual([1, 4, 5]);

    // Not even when it is the only game left unseen: the mode has then run
    // out, and another game is picked.
    expect(possiblePicks([1, 2, 4, 5], [3])).toEqual([1, 2, 4, 5]);
    expect(chooseGame(ids, new Set([1, 2, 4, 5]), [3]).reset).toBe(true);
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

    expect(chooseGame(ids, seenInSquares, []).reset).toBe(true);
    expect(chooseGame(ids, seenInHanging, []).reset).toBe(false);
    expect(possiblePicks([...seenInHanging])).toEqual(ids);
});

test('a mode that has run out is reset, and serves every game again', () => {
    const choice = chooseGame(ids, new Set(ids), [], () => 0.5);

    expect(choice).toEqual({ id: 3, reset: true });
    expect(possiblePicks(ids)).toEqual(ids);
});

test('with no games there is nothing to choose, and nothing to reset', () => {
    expect(chooseGame([], new Set(), [])).toEqual({ id: null, reset: false });
});

test('a single game is served again once it has been seen', () => {
    expect(chooseGame([7], new Set([7]), [7])).toEqual({ id: 7, reset: true });
});
