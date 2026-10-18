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

// What each piece is worth to hanging rules 2 and 3. The king's value is
// never used.
const VALUES: Readonly<Record<PieceType, number>> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
};

// An attacker, and whether it can actually capture. A pinned piece off its
// pin line still attacks a square next to the enemy king, but cannot capture.
type Attacker = { type: PieceType; captures: boolean };

// Whether a piece is hanging, from the pieces that attack and defend it.
// Kings are never hanging, but they attack and defend.
function isHanging(
    piece: Piece,
    attackers: readonly Attacker[],
    defenders: readonly PieceType[],
): boolean {
    if (piece.type === 'king' || attackers.length === 0) {
        return false;
    }

    // 1. Attacked and not defended.
    if (defenders.length === 0) {
        return true;
    }

    // 2. Attacked by a cheaper piece that can capture. A king never counts as
    // the cheaper attacker, and nothing is cheaper than a pawn.
    if (
        attackers.some(
            ({ type, captures }) =>
                captures &&
                type !== 'king' &&
                VALUES[type] < VALUES[piece.type],
        )
    ) {
        return true;
    }

    // 3. Two or more attackers and one defender, when an attacker that can
    // make the first capture is worth no more than it, or when the one
    // defender is the king. A king never makes the first capture.
    if (attackers.length >= 2 && defenders.length === 1) {
        const starters = attackers.filter(
            ({ type, captures }) => captures && type !== 'king',
        );

        return (
            starters.some(({ type }) => VALUES[type] <= VALUES[piece.type]) ||
            (defenders[0] === 'king' && starters.length > 0)
        );
    }

    return false;
}

// The lines that pin a piece to its own king, by the pinned piece's square.
// A line holds the squares between the king and the pinning piece, and the
// pinning piece's own square. Pins to any other piece are ignored.
function pinLines(board: Board): Map<Square, ReadonlySet<Square>> {
    const pins = new Map<Square, ReadonlySet<Square>>();
    const pinners: readonly [readonly Step[], readonly PieceType[]][] = [
        [STRAIGHTS, ['rook', 'queen']],
        [DIAGONALS, ['bishop', 'queen']],
    ];

    for (const [kingSquare, king] of board) {
        if (king.type !== 'king') {
            continue;
        }

        for (const [directions, types] of pinners) {
            for (const direction of directions) {
                const line: Square[] = [];
                let pinned: Square | null = null;
                let target = offset(kingSquare, direction);

                while (target !== null) {
                    line.push(target);
                    const other = board.get(target);

                    if (other !== undefined) {
                        if (pinned !== null) {
                            if (
                                other.color !== king.color &&
                                types.includes(other.type)
                            ) {
                                pins.set(pinned, new Set(line));
                            }

                            break;
                        }

                        if (other.color !== king.color) {
                            break;
                        }

                        pinned = target;
                    }

                    target = offset(target, direction);
                }
            }
        }
    }

    return pins;
}

// Every piece and pawn that is hanging, by the three rules of Appendix B.
// A piece pinned to its king attacks and defends only along its pin line,
// except on a square the other side's king attacks or defends: it still gives
// check there, so it counts in full, though it cannot capture.
function hangingSquares(board: Board): SquareSet {
    const attackersOf = new Map<Square, (Piece & { captures: boolean })[]>();
    const pins = pinLines(board);
    const kingSquares = new Map<Color, ReadonlySet<Square>>();

    for (const [square, piece] of board) {
        if (piece.type === 'king') {
            kingSquares.set(piece.color, new Set(attackSet(board, square)));
        }
    }

    for (const [square, piece] of board) {
        const line = pins.get(square);
        const enemyKing =
            kingSquares.get(piece.color === 'white' ? 'black' : 'white') ??
            new Set<Square>();

        for (const target of attackSet(board, square)) {
            const captures = line === undefined || line.has(target);

            if (!captures && !enemyKing.has(target)) {
                continue;
            }

            attackersOf.set(target, [
                ...(attackersOf.get(target) ?? []),
                { ...piece, captures },
            ]);
        }
    }

    const hanging: Square[] = [];

    for (const [square, piece] of board) {
        const around = attackersOf.get(square) ?? [];
        const enemy: Color = piece.color === 'white' ? 'black' : 'white';
        const attackers = around
            .filter((other) => other.color === enemy)
            .map(({ type, captures }) => ({ type, captures }));
        const defenders = around
            .filter((other) => other.color === piece.color)
            .map((other) => other.type);

        if (isHanging(piece, attackers, defenders)) {
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
