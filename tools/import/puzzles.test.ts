// The rules of the puzzle extract, on made-up rows with hand-written
// positions. Each position is given before the opponent's setup move.

import { expect, test } from 'vitest';
import {
    DEFAULT_OPTIONS,
    createPuzzleExtract,
    readColumns,
    type PuzzleOptions,
} from './puzzles.ts';

const HEADER =
    'PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags,DailyDate';

// A white knight on d5 and a black rook on a8, with Black to move.
const KNIGHT = 'r3k3/8/8/3N4/8/8/8/4K3 b - - 0 1';

type Row = {
    id: string;
    fen: string;
    moves: string;
    popularity?: number;
    plays?: number;
};

const line = (row: Row): string =>
    [
        row.id,
        row.fen,
        row.moves,
        '1000',
        '75',
        String(row.popularity ?? 90),
        String(row.plays ?? 600),
        'fork short',
        'https://example.org/made-up',
        '',
        '',
    ].join(',');

function extract(rows: Row[], options: PuzzleOptions = DEFAULT_OPTIONS) {
    const columns = readColumns(HEADER);
    const puzzles = createPuzzleExtract(options);

    for (const row of rows) {
        puzzles.add(line(row), columns);
    }

    return puzzles.finish();
}

test('a puzzle of four moves is accepted', () => {
    const { puzzles, report } = extract([
        { id: 'four', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8 c7a8' },
    ]);

    expect(puzzles).toEqual([
        {
            lichess_id: 'four',
            fen: KNIGHT,
            setup_move: 'e8f8',
            first_move: 'd5c7',
            reply_move: 'f8g8',
            second_move: 'c7a8',
            piece: 'knight',
            rating: 1000,
            popularity: 90,
            plays: 600,
            themes: ['fork', 'short'],
        },
    ]);
    expect(report.skipped).toEqual({});
});

test('puzzles of two, three, five and six moves are rejected', () => {
    const { puzzles, report } = extract([
        { id: 'two', fen: KNIGHT, moves: 'e8f8 d5c7' },
        { id: 'three', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8' },
        { id: 'five', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8 c7a8 g8h8' },
        { id: 'six', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8 c7a8 g8h8 a8b6' },
    ]);

    expect(puzzles).toEqual([]);
    expect(report.skipped).toEqual({ 'not two solver moves': 4 });
});

test('a different piece on the second solver move is rejected', () => {
    const { puzzles, report } = extract([
        { id: 'other', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8 e1e2' },
    ]);

    expect(puzzles).toEqual([]);
    expect(report.skipped).toEqual({ 'second move by a different piece': 1 });
});

test('a puzzle ending in checkmate is rejected', () => {
    // The rook checks on a8, Black blocks on b8, and the rook takes it
    // with mate on the back rank.
    const { puzzles, report } = extract([
        {
            id: 'mate',
            fen: '1r4k1/5ppp/8/8/8/8/8/R5K1 b - - 0 1',
            moves: 'b8b2 a1a8 b2b8 a8b8',
        },
    ]);

    expect(puzzles).toEqual([]);
    expect(report.skipped).toEqual({ 'last move is checkmate': 1 });
});

test('a last move that is not a capture is rejected', () => {
    const { puzzles, report } = extract([
        { id: 'quiet', fen: KNIGHT, moves: 'e8f8 d5c7 f8g8 c7e6' },
    ]);

    expect(puzzles).toEqual([]);
    expect(report.skipped).toEqual({ 'last move is not a capture': 1 });
});

test('en passant counts as a capture', () => {
    // The pawn steps to e5, Black pushes d7 to d5, and the pawn takes it
    // in passing on d6.
    const { puzzles } = extract([
        {
            id: 'passing',
            fen: '4k3/3p4/8/8/4P3/8/8/4K3 b - - 0 1',
            moves: 'e8f8 e4e5 d7d5 e5d6',
        },
    ]);

    expect(puzzles.map((puzzle) => [puzzle.lichess_id, puzzle.piece])).toEqual([
        ['passing', 'pawn'],
    ]);
});

test('a pawn that promotes and then captures is filed under pawn', () => {
    // The pawn becomes a queen on b8, and the queen takes the rook on a8.
    const { puzzles } = extract([
        {
            id: 'promote',
            fen: '4k3/1P6/8/8/8/8/r7/4K3 b - - 0 1',
            moves: 'e8d7 b7b8q a2a8 b8a8',
        },
    ]);

    expect(
        puzzles.map((puzzle) => [
            puzzle.piece,
            puzzle.first_move,
            puzzle.second_move,
        ]),
    ).toEqual([['pawn', 'b7b8q', 'b8a8']]);
});

test('castling as the first solver move is filed under king', () => {
    // White castles, the bishop checks on h2, and the king takes it.
    const { puzzles } = extract([
        {
            id: 'castle',
            fen: 'k7/8/3b4/8/8/8/8/4K2R b K - 0 1',
            moves: 'a8b8 e1g1 d6h2 g1h2',
        },
    ]);

    expect(puzzles.map((puzzle) => [puzzle.piece, puzzle.first_move])).toEqual([
        ['king', 'e1g1'],
    ]);
});

test('a puzzle with an illegal move is rejected', () => {
    // A knight cannot step from d5 to d6.
    const { puzzles, report } = extract([
        { id: 'illegal', fen: KNIGHT, moves: 'e8f8 d5d6 f8g8 d6d7' },
    ]);

    expect(puzzles).toEqual([]);
    expect(report.skipped).toEqual({
        'illegal move or unreadable position': 1,
    });
});

test('the per-piece cut is the same on every run', () => {
    const moves = 'e8f8 d5c7 f8g8 c7a8';
    const rows: Row[] = [
        { id: 'bbbbb', fen: KNIGHT, moves, popularity: 90, plays: 600 },
        { id: 'aaaaa', fen: KNIGHT, moves, popularity: 90, plays: 600 },
        { id: 'ccccc', fen: KNIGHT, moves, popularity: 95, plays: 500 },
        { id: 'ddddd', fen: KNIGHT, moves, popularity: 90, plays: 900 },
        { id: 'eeeee', fen: KNIGHT, moves, popularity: 85, plays: 9000 },
    ];
    const options = { ...DEFAULT_OPTIONS, perCategory: 3 };
    const kept = (input: Row[]): string[] =>
        extract(input, options).puzzles.map((puzzle) => puzzle.lichess_id);

    // The most popular, then the most played, then by puzzle ID.
    expect(kept(rows)).toEqual(['ccccc', 'ddddd', 'aaaaa']);
    expect(kept([...rows].reverse())).toEqual(['ccccc', 'ddddd', 'aaaaa']);
    expect(extract(rows, options).report.skipped).toEqual({
        'beyond --per-category': 2,
    });
});
