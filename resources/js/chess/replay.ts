// Replays a game written in PGN, using the rules library. The import scripts
// use this to verify every game: a game with an illegal move does not replay.

import { Chess } from 'chess.js';
import {
    PIECE_TYPES,
    parseMove,
    type Move,
    type PieceType,
} from './conventions.ts';
import { letterOf } from './position.ts';

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

export type ReplayedPuzzle = {
    /** Every move in order: the setup move, then the solver and the opponent in turn. */
    moves: Move[];
    /** The type of the piece making the solver's first move, before any promotion. */
    piece: PieceType;
    /** Whether the last move is checkmate. */
    endsInMate: boolean;
    /** Whether the last move takes a piece or pawn, en passant included. */
    endsWithCapture: boolean;
};

/**
 * Replays a puzzle from its position. The first move is the opponent's setup
 * move and the second is the solver's first. Throws when the position cannot
 * be read or a move is illegal.
 */
export function replayPuzzle(
    fen: string,
    moves: readonly Move[],
): ReplayedPuzzle {
    const chess = new Chess(fen);
    const played = moves.map((text) => {
        const move = parseMove(text);

        if (move === null) {
            throw new Error(`Not a move: ${text}`);
        }

        return chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion ?? undefined,
        });
    });

    const letter = played[1]?.piece;
    const piece = PIECE_TYPES.find((type) => letterOf(type) === letter);

    if (piece === undefined) {
        throw new Error('A puzzle needs a setup move and a solver move.');
    }

    return {
        moves: played.map((move) => move.lan),
        piece,
        endsInMate: chess.isCheckmate(),
        endsWithCapture: played.at(-1)?.captured !== undefined,
    };
}
