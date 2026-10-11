// The shared formats for squares, moves and pieces: Appendix A of
// docs/requirements.md. The import scripts, the data endpoints and the
// browser all use these, so nothing converts between formats at a boundary.

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/** A lowercase square name, such as `e4`. */
export type Square = `${File}${Rank}`;

/** Square names with no duplicates, sorted alphabetically. */
export type SquareSet = readonly Square[];

export type Color = 'white' | 'black';

export const PIECE_TYPES = [
    'pawn',
    'knight',
    'bishop',
    'rook',
    'queen',
    'king',
] as const;

export type PieceType = (typeof PIECE_TYPES)[number];

export type Piece = {
    color: Color;
    type: PieceType;
};

export const PROMOTION_PIECES = {
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
} as const satisfies Record<string, PieceType>;

export type PromotionLetter = keyof typeof PROMOTION_PIECES;

/**
 * A move as it is stored: from-square, to-square, then a promotion letter if
 * any, such as `e2e4` or `e7e8q`. Castling is the king's start and end
 * squares. The text is checked by `parseMove`, not by the compiler.
 */
export type Move = string;

export type MoveParts = {
    from: Square;
    to: Square;
    promotion: PromotionLetter | null;
};

/** A half-move number starting at 1. Odd plies are White's. */
export type Ply = number;

export const PHASES = ['lost', 'controlled', 'hanging'] as const;

export type Phase = (typeof PHASES)[number];

export function isSquare(text: string): text is Square {
    return /^[a-h][1-8]$/.test(text);
}

function isPromotionLetter(text: string): text is PromotionLetter {
    return Object.hasOwn(PROMOTION_PIECES, text);
}

export function toSquareSet(squares: Iterable<Square>): SquareSet {
    return [...new Set(squares)].sort();
}

/** Two sets are equal when they hold the same squares, in any order. */
export function squareSetsEqual(
    a: Iterable<Square>,
    b: Iterable<Square>,
): boolean {
    const left = new Set(a);
    const right = new Set(b);

    return (
        left.size === right.size &&
        [...left].every((square) => right.has(square))
    );
}

export function parseMove(text: Move): MoveParts | null {
    const from = text.slice(0, 2);
    const to = text.slice(2, 4);
    const promotion = text.slice(4);

    if (!isSquare(from) || !isSquare(to)) {
        return null;
    }

    if (promotion === '') {
        return { from, to, promotion: null };
    }

    if (!isPromotionLetter(promotion)) {
        return null;
    }

    return { from, to, promotion };
}

export function formatMove(move: MoveParts): Move {
    return `${move.from}${move.to}${move.promotion ?? ''}`;
}

/** Written notation is never compared, only these three parts. */
export function movesEqual(a: MoveParts, b: MoveParts): boolean {
    return a.from === b.from && a.to === b.to && a.promotion === b.promotion;
}

// Every game starts from the standard position, so a king only ever castles
// from e1 or e8, and it can reach these rook squares in no other way.
const KING_ONTO_ROOK: Readonly<Record<string, Square>> = {
    e1h1: 'g1',
    e1a1: 'c1',
    e8h8: 'g8',
    e8a8: 'c8',
};

/**
 * A board may report castling as the king moving onto its rook. This rewrites
 * it to the king's two-square move and leaves every other move alone.
 */
export function normalizeCastling(
    move: MoveParts,
    movingPiece: PieceType,
): MoveParts {
    if (movingPiece !== 'king') {
        return move;
    }

    const to = KING_ONTO_ROOK[`${move.from}${move.to}`];

    return to === undefined ? move : { ...move, to };
}

export function colorOfPly(ply: Ply): Color {
    return ply % 2 === 1 ? 'white' : 'black';
}

/** Whether a move made on the board matches the move played in the game. */
export function isCorrectGuess(
    guess: MoveParts,
    played: MoveParts,
    movingPiece: PieceType,
): boolean {
    return movesEqual(normalizeCastling(guess, movingPiece), played);
}
