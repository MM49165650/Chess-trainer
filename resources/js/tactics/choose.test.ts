// The order puzzles are served in, and which seen records a category clears
// when it runs out. The lists are made up for the test.

import { expect, test } from 'vitest';
import type { PuzzleIdListData } from '@/generated/data';
import { seenToClear, servingOrder, type SeenPuzzle } from './choose';

const knights: PuzzleIdListData = {
    piece: 'knight',
    items: [
        [12, 600],
        [5, 700],
        [9, 700],
        [3, 900],
    ],
};

const rooks: PuzzleIdListData = {
    piece: 'rook',
    items: [
        [20, 500],
        [7, 700],
        [21, 800],
    ],
};

const ids = (lists: PuzzleIdListData[], seen: number[] = []): number[] =>
    servingOrder(lists, new Set(seen)).map((entry) => entry.id);

test('puzzles are served easiest first, and by ID where ratings are equal', () => {
    // The order does not depend on the order the list arrives in.
    const shuffled: PuzzleIdListData = {
        piece: 'knight',
        items: [
            [9, 700],
            [3, 900],
            [5, 700],
            [12, 600],
        ],
    };

    expect(ids([knights])).toEqual([12, 5, 9, 3]);
    expect(ids([shuffled])).toEqual([12, 5, 9, 3]);
});

test('seen puzzles are left out', () => {
    expect(ids([knights], [12, 9])).toEqual([5, 3]);
});

test('all pieces is one list across the pieces, by rating and then ID', () => {
    const order = servingOrder([knights, rooks], new Set());

    expect(order.map((entry) => entry.id)).toEqual([20, 12, 5, 7, 9, 21, 3]);

    // Each puzzle keeps its own piece, for the tally it counts towards.
    expect(order[0]).toEqual({ id: 20, rating: 500, piece: 'rook' });
    expect(order[1]).toEqual({ id: 12, rating: 600, piece: 'knight' });
});

test('the pool is empty when every puzzle has been seen', () => {
    expect(ids([knights], [12, 5, 9, 3])).toEqual([]);
    expect(ids([knights, rooks], [12, 5, 9, 3, 20, 7, 21])).toEqual([]);
});

test('a puzzle seen in its own category is left out of all pieces, and the other way round', () => {
    // There is one seen record per puzzle, whichever category it was
    // played in.
    const seen = [5, 20];

    expect(ids([knights, rooks], seen)).toEqual([12, 7, 9, 21, 3]);
    expect(ids([knights], seen)).toEqual([12, 9, 3]);
    expect(ids([rooks], seen)).toEqual([7, 21]);

    // A piece that has run out is passed over in all pieces.
    expect(ids([knights, rooks], [12, 5, 9, 3])).toEqual([20, 7, 21]);
});

test("clearing one piece leaves the others' seen records alone", () => {
    const seen: SeenPuzzle[] = [
        { puzzleId: 12, piece: 'knight' },
        { puzzleId: 20, piece: 'rook' },
        { puzzleId: 5, piece: 'knight' },
        { puzzleId: 7, piece: 'rook' },
    ];

    expect(seenToClear(seen, 'knight')).toEqual([12, 5]);
    expect(seenToClear(seen, 'rook')).toEqual([20, 7]);
    expect(seenToClear(seen, 'queen')).toEqual([]);

    // When all pieces runs out, every record goes.
    expect(seenToClear(seen, 'all')).toEqual([12, 20, 5, 7]);
});
