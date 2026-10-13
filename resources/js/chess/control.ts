// The control and hanging calculation: Appendix B of docs/requirements.md.
// It works on a plain map of squares to pieces and never touches the rules
// library, so its behaviour is fixed by the golden tests alone. The caller
// replays the game and passes in the positions before and after each move.

import {
    isSquare,
    toSquareSet,
    type Color,
    type MoveParts,
    type Piece,
    type PieceType,
    type Square,
    type SquareSet,
} from './conventions.ts';

export type Board = ReadonlyMap<Square, Piece>;

/** What one piece lost and now controls by moving. */
export type PieceAnswers = {
    lost: SquareSet;
    controlled: SquareSet;
};

export type MoveAnswers = PieceAnswers & {
    piece: PieceType;
    /** The rook's answers on a castling move, and null on every other. */
    rook: PieceAnswers | null;
    hanging: SquareSet;
};

type Step = readonly [files: number, ranks: number];

const FILES = 'abcdefgh';

const DIAGONALS: readonly Step[] = [
    [1, 1],
    [1, -1],
    [-1, -1],
    [-1, 1],
];

const STRAIGHTS: readonly Step[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
];

const ALL_DIRECTIONS: readonly Step[] = [...DIAGONALS, ...STRAIGHTS];

const KNIGHT_JUMPS: readonly Step[] = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
];

// A pawn controls its two forward diagonals, never the squares it pushes to.
const PAWN_DIAGONALS: Readonly<Record<Color, readonly Step[]>> = {
    white: [
        [-1, 1],
        [1, 1],
    ],
    black: [
        [-1, -1],
        [1, -1],
    ],
};

const FEN_PIECES: Readonly<Record<string, PieceType>> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
};

// The rook's start and end squares, by the king's castling move.
const CASTLING_ROOKS: Readonly<Record<string, readonly [Square, Square]>> = {
    e1g1: ['h1', 'f1'],
    e1c1: ['a1', 'd1'],
    e8g8: ['h8', 'f8'],
    e8c8: ['a8', 'd8'],
};

/** Reads the piece placement of a FEN. The other fields are ignored. */
export function boardFromFen(fen: string): Board {
    const board = new Map<Square, Piece>();
    const rows = (fen.split(' ')[0] ?? '').split('/');

    rows.forEach((row, index) => {
        let file = 0;

        for (const letter of row) {
            const type = FEN_PIECES[letter.toLowerCase()];

            if (type === undefined) {
                file += Number(letter);
                continue;
            }

            const square = `${FILES.charAt(file)}${String(8 - index)}`;

            if (!isSquare(square)) {
                throw new Error(`Not a valid position: ${fen}`);
            }

            board.set(square, {
                color: letter === letter.toLowerCase() ? 'black' : 'white',
                type,
            });
            file += 1;
        }
    });

    return board;
}

function offset(square: Square, [files, ranks]: Step): Square | null {
    const file = FILES[FILES.indexOf(square.charAt(0)) + files];
    const rank = Number(square.charAt(1)) + ranks;

    if (file === undefined) {
        return null;
    }

    const name = `${file}${String(rank)}`;

    return isSquare(name) ? name : null;
}

function stepsFrom(square: Square, steps: readonly Step[]): Square[] {
    return steps
        .map((step) => offset(square, step))
        .filter((target) => target !== null);
}

// Each line runs up to and including the first occupied square.
function linesFrom(
    board: Board,
    square: Square,
    directions: readonly Step[],
): Square[] {
    const squares: Square[] = [];

    for (const direction of directions) {
        let target = offset(square, direction);

        while (target !== null) {
            squares.push(target);

            if (board.has(target)) {
                break;
            }

            target = offset(target, direction);
        }
    }

    return squares;
}

/**
 * The squares attacked by the piece on a square, judged purely by geometry.
 * The colour of a piece on an attacked square does not matter, and pins,
 * checks and whose turn it is are ignored.
 */
export function attackSet(board: Board, square: Square): Square[] {
    const piece = board.get(square);

    if (piece === undefined) {
        return [];
    }

    switch (piece.type) {
        case 'knight':
            return stepsFrom(square, KNIGHT_JUMPS);
        case 'king':
            return stepsFrom(square, ALL_DIRECTIONS);
        case 'pawn':
            return stepsFrom(square, PAWN_DIAGONALS[piece.color]);
        case 'bishop':
            return linesFrom(board, square, DIAGONALS);
        case 'rook':
            return linesFrom(board, square, STRAIGHTS);
        case 'queen':
            return linesFrom(board, square, ALL_DIRECTIONS);
    }
}

// Every piece and pawn except the kings that is attacked by an enemy and
// defended by no other piece of its own colour. Kings attack and defend.
function hangingSquares(board: Board): SquareSet {
    const attackedBy: Record<Color, Set<Square>> = {
        white: new Set(),
        black: new Set(),
    };

    for (const [square, piece] of board) {
        for (const target of attackSet(board, square)) {
            attackedBy[piece.color].add(target);
        }
    }

    const hanging: Square[] = [];

    for (const [square, piece] of board) {
        const enemy: Color = piece.color === 'white' ? 'black' : 'white';

        if (
            piece.type !== 'king' &&
            attackedBy[enemy].has(square) &&
            !attackedBy[piece.color].has(square)
        ) {
            hanging.push(square);
        }
    }

    return toSquareSet(hanging);
}

/**
 * The answers for one move, from the positions before and after it. The move
 * is in its normalized form, so castling is the king's two-square move.
 */
export function calculateMove(
    before: Board,
    after: Board,
    move: MoveParts,
): MoveAnswers {
    const mover = before.get(move.from);

    if (mover === undefined) {
        throw new Error(`No piece on ${move.from} to move.`);
    }

    // What one piece lost and now controls by going from one square to another.
    const answersOf = (from: Square, to: Square): PieceAnswers => {
        // After a promotion the piece on the destination is the new piece.
        const afterSet = attackSet(after, to);

        return {
            lost: toSquareSet(
                attackSet(before, from).filter(
                    (square) => !afterSet.includes(square),
                ),
            ),
            controlled: toSquareSet(afterSet),
        };
    };

    // Castling is marked as two pieces: the king's answers are the move's
    // own, and the rook's are kept apart.
    const rook = CASTLING_ROOKS[`${move.from}${move.to}`];

    return {
        piece: mover.type,
        ...answersOf(move.from, move.to),
        rook:
            mover.type === 'king' && rook !== undefined
                ? answersOf(...rook)
                : null,
        hanging: hangingSquares(after),
    };
}
