// What the board needs to know about a position: whose turn it is, the legal
// moves, and the result of playing one. The rules library answers all of it.

import { Chess } from 'chess.js';
import {
    PIECE_TYPES,
    type Color,
    type MoveParts,
    type PieceType,
    type Square,
} from './conventions';

export type Position = {
    turn: Color;
    /** For each piece of the side to move, the squares it may move to. */
    destinations: Map<Square, Square[]>;
    /** Whether the king of the side to move is in check. */
    inCheck: boolean;
};

export function readPosition(fen: string): Position {
    const chess = new Chess(fen);
    const destinations = new Map<Square, Square[]>();

    for (const move of chess.moves({ verbose: true })) {
        const squares = destinations.get(move.from) ?? [];

        // The four promotions of one pawn move share a destination.
        if (!squares.includes(move.to)) {
            squares.push(move.to);
        }

        destinations.set(move.from, squares);
    }

    return {
        turn: chess.turn() === 'w' ? 'white' : 'black',
        destinations,
        inCheck: chess.inCheck(),
    };
}

export function pieceTypeAt(fen: string, square: Square): PieceType | null {
    const letter = new Chess(fen).get(square)?.type;

    return PIECE_TYPES.find((type) => letterOf(type) === letter) ?? null;
}

// The rules library names a piece by its first letter, with n for the knight.
function letterOf(type: PieceType): string {
    return type === 'knight' ? 'n' : type.charAt(0);
}

/** Whether a legal move from one square to another needs a promotion piece. */
export function isPromotionMove(
    fen: string,
    from: Square,
    to: Square,
): boolean {
    return new Chess(fen)
        .moves({ verbose: true })
        .some(
            (move) =>
                move.from === from &&
                move.to === to &&
                move.promotion !== undefined,
        );
}

/** The position after a move, or null when the move is not legal. */
export function playMove(fen: string, move: MoveParts): string | null {
    const chess = new Chess(fen);

    try {
        chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion ?? undefined,
        });
    } catch {
        return null;
    }

    return chess.fen();
}
