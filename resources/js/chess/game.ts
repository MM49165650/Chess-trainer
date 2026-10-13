// Stepping through a game that is already known to be legal, and putting a
// move into words. The rules library does the chess.

import { Chess } from 'chess.js';
import { isSquare, type Move, type MoveParts } from './conventions.ts';
import { pieceTypeAt } from './position.ts';

/**
 * The position before each move of a game, and after its last one: entry 0
 * is the starting position and entry n is the position after n plies.
 */
export function positionsOf(moves: readonly { uci: Move }[]): string[] {
    const chess = new Chess();
    const positions = [chess.fen()];

    for (const { uci } of moves) {
        chess.move(uci);
        positions.push(chess.fen());
    }

    return positions;
}

/**
 * The same for a line that starts from a position of its own, such as a
 * puzzle: entry 0 is that position and entry n is the one after n moves.
 */
export function positionsFrom(fen: string, moves: readonly Move[]): string[] {
    const chess = new Chess(fen);
    const positions = [chess.fen()];

    for (const uci of moves) {
        chess.move(uci);
        positions.push(chess.fen());
    }

    return positions;
}

/** The written form of a move in a position, or null when it is not legal. */
export function writtenMove(fen: string, move: MoveParts): string | null {
    try {
        return new Chess(fen).move({
            from: move.from,
            to: move.to,
            promotion: move.promotion ?? undefined,
        }).san;
    } catch {
        return null;
    }
}

/** Whether a written move is a capture. */
export function isCapture(san: string): boolean {
    return san.includes('x');
}

/** Whether a written move is castling, on either side. */
export function isCastling(san: string): boolean {
    return san.startsWith('O-O');
}

/** The moves where the control rules are easiest to get wrong. */
export type SpecialMove = 'castling' | 'promotion' | 'en passant';

/**
 * Whether a move is castling, a promotion or an en passant capture, from
 * the position before it. A pawn that captures onto an empty square has
 * captured en passant.
 */
export function specialMoveOf(
    fenBefore: string,
    move: { uci: Move; san: string },
): SpecialMove | null {
    if (isCastling(move.san)) {
        return 'castling';
    }

    if (move.san.includes('=')) {
        return 'promotion';
    }

    const to = move.uci.slice(2, 4);

    return /^[a-h]x/.test(move.san) &&
        isSquare(to) &&
        pieceTypeAt(fenBefore, to) === null
        ? 'en passant'
        : null;
}
