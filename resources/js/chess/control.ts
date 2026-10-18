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

// What each piece is worth in the exchange. A king always captures last, and
// its own value is never used, because nothing can take it back.
const VALUES: Readonly<Record<PieceType, number>> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: Infinity,
};

// A piece that can take part in the exchange on a square, and whether it can
// actually capture. A pinned piece off its pin line cannot, but it still
// attacks the square, so the other side's king cannot capture there.
type Capturer = { type: PieceType; captures: boolean };

// One side's capturers on a square, as lines: a piece that attacks the square,
// then the pieces lined up behind it, in the order they can capture.
type Lines = readonly (readonly Capturer[])[];

// The step from one square to another on the same rank, file or diagonal.
function stepTowards(from: Square, to: Square): Step {
    const files = FILES.indexOf(to.charAt(0)) - FILES.indexOf(from.charAt(0));
    const ranks = Number(to.charAt(1)) - Number(from.charAt(1));

    return [Math.sign(files), Math.sign(ranks)];
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

function opponent(color: Color): Color {
    return color === 'white' ? 'black' : 'white';
}

// Both sides' capturers on a square. Behind a rook, bishop, queen or pawn
// that attacks the square, the next piece on the line running away from it
// joins in if it is of the same colour and moves along that line, and so on
// down the line. Nothing behind a knight or a king counts.
function capturersOf(
    board: Board,
    attacks: ReadonlyMap<Square, readonly Square[]>,
    pins: ReadonlyMap<Square, ReadonlySet<Square>>,
    square: Square,
): Record<Color, Lines> {
    const lines: Record<Color, Capturer[][]> = { white: [], black: [] };
    const capturer = (from: Square, piece: Piece): Capturer => ({
        type: piece.type,
        captures: pins.get(from)?.has(square) ?? true,
    });

    for (const [from, piece] of board) {
        if (!(attacks.get(from) ?? []).includes(square)) {
            continue;
        }

        const line = [capturer(from, piece)];

        if (piece.type !== 'knight' && piece.type !== 'king') {
            const step = stepTowards(square, from);
            const movers: readonly PieceType[] =
                step[0] === 0 || step[1] === 0
                    ? ['rook', 'queen']
                    : ['bishop', 'queen'];
            let target = offset(from, step);

            while (target !== null) {
                const other = board.get(target);

                if (other !== undefined) {
                    if (
                        other.color !== piece.color ||
                        !movers.includes(other.type)
                    ) {
                        break;
                    }

                    line.push(capturer(target, other));
                }

                target = offset(target, step);
            }
        }

        lines[piece.color].push(line);
    }

    return lines;
}

// The most one side can win by capturing next on a square, where `target` is
// the value of the piece standing there and `used` counts how many pieces of
// each line have already captured. The side captures with its cheapest piece
// that can, and either side may stop instead, so the result is never below 0.
// A king captures only when nothing of the other side still attacks the
// square, and that ends the exchange.
function exchange(
    lines: Record<Color, Lines>,
    used: Record<Color, readonly number[]>,
    side: Color,
    target: number,
): number {
    const ready = (color: Color) =>
        lines[color].flatMap((line, index) => {
            const head = line[used[color][index] ?? 0];

            return head === undefined ? [] : [{ ...head, index }];
        });
    const capturer = ready(side)
        .filter(({ captures }) => captures)
        .sort((a, b) => VALUES[a.type] - VALUES[b.type])[0];

    if (capturer === undefined) {
        return 0;
    }

    if (capturer.type === 'king') {
        return ready(opponent(side)).length === 0 ? target : 0;
    }

    const next = {
        ...used,
        [side]: used[side].map((count, index) =>
            index === capturer.index ? count + 1 : count,
        ),
    };

    return Math.max(
        0,
        target - exchange(lines, next, opponent(side), VALUES[capturer.type]),
    );
}

// Every piece and pawn that is hanging, by Appendix B, step 6: the other side
// can win material by capturing on its square. Pins are worked out once, in
// this position, and not again during the exchange.
function hangingSquares(board: Board): SquareSet {
    const pins = pinLines(board);
    const attacks = new Map(
        [...board.keys()].map((square) => [square, attackSet(board, square)]),
    );
    const hanging: Square[] = [];

    for (const [square, piece] of board) {
        if (piece.type === 'king') {
            continue;
        }

        const lines = capturersOf(board, attacks, pins, square);
        const used = {
            white: lines.white.map(() => 0),
            black: lines.black.map(() => 0),
        };

        if (
            exchange(lines, used, opponent(piece.color), VALUES[piece.type]) > 0
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
