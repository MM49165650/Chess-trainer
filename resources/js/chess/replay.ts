// Replays a game written in PGN, using the rules library. The import scripts
// use this to verify every game: a game with an illegal move does not replay.

import { Chess } from 'chess.js';
import type { Move } from './conventions';

export type ReplayedMove = {
    /** From-square, to-square, then a promotion letter if any. */
    uci: Move;
    /** Standard notation, for display only. */
    san: string;
};

export type ReplayedGame = {
    /** The PGN tags, such as Event, White and Result. */
    tags: Record<string, string>;
    moves: ReplayedMove[];
    /** The position after the last move. */
    fen: string;
};

/**
 * Replays one game. Comments, side variations and annotation symbols are
 * dropped. Throws when the text cannot be read or a move is illegal.
 */
export function replayPgn(pgn: string): ReplayedGame {
    const chess = new Chess();

    chess.loadPgn(pgn);

    const tags: Record<string, string> = {};

    for (const [name, value] of Object.entries(chess.getHeaders())) {
        if (typeof value === 'string') {
            tags[name] = value;
        }
    }

    return {
        tags,
        moves: chess
            .history({ verbose: true })
            .map((move) => ({ uci: move.lan, san: move.san })),
        fen: chess.fen(),
    };
}
