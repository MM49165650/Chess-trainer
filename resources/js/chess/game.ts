// Stepping through a game that is already known to be legal, and putting a
// move into words. The rules library does the chess.

import { Chess } from 'chess.js';
import type { Move, MoveParts } from './conventions';

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
