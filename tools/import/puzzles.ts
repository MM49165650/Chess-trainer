// The rules of the puzzle extract: Appendix E of docs/requirements.md. It
// turns the rows of the Lichess puzzle file into the puzzles for the
// intermediate file. Reading and writing files is left to extract-puzzles.ts.

import { PIECE_TYPES } from '../../resources/js/chess/conventions.ts';
import { replayPuzzle } from '../../resources/js/chess/replay.ts';
import type { PuzzleImportData } from '../../resources/js/generated/data.ts';

export type PuzzleOptions = {
    /** The highest puzzle rating kept. */
    maxRating: number;
    /** The lowest popularity kept. */
    minPopularity: number;
    /** The fewest plays kept. */
    minPlays: number;
    /** The most puzzles kept per piece. */
    perCategory: number;
};

export const DEFAULT_OPTIONS: PuzzleOptions = {
    maxRating: 1500,
    minPopularity: 80,
    minPlays: 500,
    perCategory: 2000,
};

/** One row of the Lichess file, with only the columns the extract uses. */
export type PuzzleRow = {
    id: string;
    fen: string;
    /** The opponent's setup move, then the solver and the opponent in turn. */
    moves: string[];
    rating: number;
    popularity: number;
    plays: number;
    /** Lichess's theme labels, exactly as given. */
    themes: string[];
};

type Column =
    | 'PuzzleId'
    | 'FEN'
    | 'Moves'
    | 'Rating'
    | 'Popularity'
    | 'NbPlays'
    | 'Themes';

/** Where each column sits in a row, with how many columns a row has. */
export type ColumnPositions = Record<Column, number> & { count: number };

/**
 * Finds the columns by name in the first line of the file. Throws when one
 * is missing.
 */
export function readColumns(headerLine: string): ColumnPositions {
    const names = headerLine.trim().split(',');
    const position = (name: Column): number => {
        const index = names.indexOf(name);

        if (index === -1) {
            throw new Error(`The file has no ${name} column.`);
        }

        return index;
    };

    return {
        PuzzleId: position('PuzzleId'),
        FEN: position('FEN'),
        Moves: position('Moves'),
        Rating: position('Rating'),
        Popularity: position('Popularity'),
        NbPlays: position('NbPlays'),
        Themes: position('Themes'),
        count: names.length,
    };
}

/** Reads one row, or returns null when it does not have the file's shape. */
export function readRow(
    line: string,
    columns: ColumnPositions,
): PuzzleRow | null {
    const fields = line.split(',');
    const rating = Number(fields[columns.Rating]);
    const popularity = Number(fields[columns.Popularity]);
    const plays = Number(fields[columns.NbPlays]);
    const id = fields[columns.PuzzleId] ?? '';

    if (
        fields.length !== columns.count ||
        id === '' ||
        !Number.isInteger(rating) ||
        !Number.isInteger(popularity) ||
        !Number.isInteger(plays)
    ) {
        return null;
    }

    return {
        id,
        fen: fields[columns.FEN] ?? '',
        moves: (fields[columns.Moves] ?? '').split(' '),
        rating,
        popularity,
        plays,
        themes: (fields[columns.Themes] ?? '')
            .split(' ')
            .filter((theme) => theme !== ''),
    };
}

/** Four moves: the setup move, the solver, the reply, the solver again. */
export function hasPuzzleLength(row: PuzzleRow): boolean {
    return row.moves.length === 4;
}

/**
 * The same-piece rule: the solver's second move must start on the square
 * where the solver's first move ended.
 */
export function samePieceMovesTwice(row: PuzzleRow): boolean {
    const [, first, , second] = row.moves;

    return (
        first !== undefined &&
        second !== undefined &&
        second.slice(0, 2) === first.slice(2, 4)
    );
}

/** A puzzle, with what the extract needs to know about its last move. */
export type ReadPuzzle = {
    puzzle: PuzzleImportData;
    /** Whether the solver's last move is checkmate. */
    endsInMate: boolean;
    /** Whether the solver's last move takes a piece or pawn. */
    endsWithCapture: boolean;
};

/** Replays a row into a puzzle, or returns null when it does not replay. */
export function toPuzzle(row: PuzzleRow): ReadPuzzle | null {
    let replayed;

    try {
        replayed = replayPuzzle(row.fen, row.moves);
    } catch {
        return null;
    }

    const [setup, first, reply, second] = replayed.moves;

    if (
        setup === undefined ||
        first === undefined ||
        reply === undefined ||
        second === undefined
    ) {
        return null;
    }

    return {
        puzzle: {
            lichess_id: row.id,
            fen: row.fen,
            setup_move: setup,
            first_move: first,
            reply_move: reply,
            second_move: second,
            piece: replayed.piece,
            rating: row.rating,
            popularity: row.popularity,
            plays: row.plays,
            themes: row.themes,
        },
        endsInMate: replayed.endsInMate,
        endsWithCapture: replayed.endsWithCapture,
    };
}

/**
 * The order in which a category is cut down: the most popular first, then
 * the most played, then by puzzle ID, so the choice is the same on every run.
 */
export function byPopularity(
    a: { lichess_id: string; popularity: number; plays: number },
    b: { lichess_id: string; popularity: number; plays: number },
): number {
    return (
        b.popularity - a.popularity ||
        b.plays - a.plays ||
        (a.lichess_id < b.lichess_id ? -1 : a.lichess_id > b.lichess_id ? 1 : 0)
    );
}

export type PuzzleReport = {
    /** How many rows the input held. */
    read: number;
    accepted: number;
    /** Skipped rows, counted by reason. */
    skipped: Record<string, number>;
    /** Accepted puzzles per piece. */
    byPiece: Record<string, number>;
};

export type PuzzleExtract = {
    /** Takes one row of the file, as text. */
    add: (line: string, columns: ColumnPositions) => void;
    /** Cuts each category to its limit and returns what is left. */
    finish: () => { puzzles: PuzzleImportData[]; report: PuzzleReport };
};

/**
 * Collects the puzzles of a file one row at a time, so the file can be read
 * as a stream.
 */
export function createPuzzleExtract(options: PuzzleOptions): PuzzleExtract {
    const byPiece = new Map<string, PuzzleImportData[]>();
    const ids = new Set<string>();
    const skipped: Record<string, number> = {};
    let read = 0;

    const skip = (reason: string, rows = 1): void => {
        skipped[reason] = (skipped[reason] ?? 0) + rows;
    };

    // The cheap rules come before the replay, which is the slow one.
    const reasonToSkip = (row: PuzzleRow): string | null => {
        if (!hasPuzzleLength(row)) {
            return 'not two solver moves';
        }

        if (!samePieceMovesTwice(row)) {
            return 'second move by a different piece';
        }

        if (row.rating > options.maxRating) {
            return 'above --max-rating';
        }

        if (row.popularity < options.minPopularity) {
            return 'below --min-popularity';
        }

        if (row.plays < options.minPlays) {
            return 'below --min-plays';
        }

        return ids.has(row.id) ? 'repeated puzzle ID' : null;
    };

    return {
        add(line, columns) {
            read += 1;

            const row = readRow(line, columns);

            if (row === null) {
                skip('unreadable row');

                return;
            }

            const reason = reasonToSkip(row);

            if (reason !== null) {
                skip(reason);

                return;
            }

            const replayed = toPuzzle(row);

            if (replayed === null) {
                skip('illegal move or unreadable position');

                return;
            }

            const { puzzle, endsInMate, endsWithCapture } = replayed;

            // The mode is about winning material by capturing with a piece.
            if (endsInMate) {
                skip('last move is checkmate');

                return;
            }

            if (!endsWithCapture) {
                skip('last move is not a capture');

                return;
            }

            ids.add(puzzle.lichess_id);
            const category = byPiece.get(puzzle.piece) ?? [];

            category.push(puzzle);
            byPiece.set(puzzle.piece, category);
        },

        finish() {
            const puzzles: PuzzleImportData[] = [];
            const counts: Record<string, number> = {};

            for (const piece of PIECE_TYPES) {
                const all = (byPiece.get(piece) ?? []).sort(byPopularity);
                const kept = all.slice(0, options.perCategory);

                if (all.length > kept.length) {
                    skip('beyond --per-category', all.length - kept.length);
                }

                counts[piece] = kept.length;
                puzzles.push(...kept);
            }

            return {
                puzzles,
                report: {
                    read,
                    accepted: puzzles.length,
                    skipped,
                    byPiece: counts,
                },
            };
        },
    };
}

/** The report as the lines that are printed. */
export function formatReport(report: PuzzleReport): string[] {
    const lines = [
        `  Puzzles read    ${String(report.read)}`,
        `  Accepted        ${String(report.accepted)}`,
        `  Skipped         ${String(report.read - report.accepted)}`,
    ];

    for (const [reason, count] of Object.entries(report.skipped).sort(
        ([, a], [, b]) => b - a,
    )) {
        lines.push(`    ${String(count).padStart(8)}  ${reason}`);
    }

    lines.push('', '  Accepted by piece:');

    for (const [piece, count] of Object.entries(report.byPiece)) {
        lines.push(`    ${piece.padEnd(8)}${String(count).padStart(6)}`);
    }

    return lines;
}
