// Games that include castling on both sides, a promotion and an en passant
// capture replay correctly. The games are made up for the test.

import { expect, test } from 'vitest';
import { replayPgn } from './replay';

const uci = (pgn: string): string[] =>
    replayPgn(pgn).moves.map((move) => move.uci);

test('castling is the king moving two squares, on either side', () => {
    const game = replayPgn(
        '1. e4 e5 2. Nf3 Nc6 3. Bc4 d6 4. O-O Bg4 5. d3 Qd7 6. Nc3 O-O-O 1-0',
    );

    expect(game.moves[6]).toEqual({ uci: 'e1g1', san: 'O-O' });
    expect(game.moves[11]).toEqual({ uci: 'e8c8', san: 'O-O-O' });

    // Both kings and both rooks have moved.
    expect(game.fen).toBe(
        '2kr1bnr/pppq1ppp/2np4/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 3 7',
    );
});

test('a promotion carries the letter of the new piece', () => {
    const game = replayPgn(
        '1. h4 g5 2. hxg5 a6 3. g6 a5 4. gxh7 a4 5. hxg8=Q 1-0',
    );

    expect(game.moves[8]).toEqual({ uci: 'h7g8q', san: 'hxg8=Q' });
    expect(uci('1. h4 g5 2. hxg5 a6 3. g6 a5 4. gxh7 a4 5. hxg8=N *')[8]).toBe(
        'h7g8n',
    );

    // The pawn is gone and a white queen stands on g8.
    expect(game.fen.startsWith('rnbqkbQr/')).toBe(true);
});

test('an en passant capture removes the pawn it passed', () => {
    const game = replayPgn('1. e4 a6 2. e5 d5 3. exd6 1-0');

    expect(game.moves[4]).toEqual({ uci: 'e5d6', san: 'exd6' });

    // The black pawn has left d5, and the white pawn stands on d6.
    expect(game.fen).toBe(
        'rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3',
    );
});

test('comments, side variations and annotation symbols are dropped', () => {
    expect(
        uci(
            '[Event "Made up"]\r\n[Result "1-0"]\r\n\r\n1. e4 {best by test} e5 $1 2. Nf3 (2. f4 exf4) Nc6! 3. Bb5 a6?? 1-0',
        ),
    ).toEqual(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6']);
});

test('a game with an illegal move does not replay', () => {
    expect(() => replayPgn('1. e4 e5 2. Ke3 1-0')).toThrow();
});
