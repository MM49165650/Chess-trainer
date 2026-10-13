// The rules of the practice game extract: Appendix E of docs/requirements.md.
// It turns the games of a Lichess monthly file into the games for the
// intermediate file, each with the answers of Appendix B for every move.
// Reading and writing files is left to extract-practice.ts.

import { createHash } from 'node:crypto';
import {
    boardFromFen,
    calculateMove,
} from '../../resources/js/chess/control.ts';
import { parseMove } from '../../resources/js/chess/conventions.ts';
import { positionsOf } from '../../resources/js/chess/game.ts';
import { replayPgn } from '../../resources/js/chess/replay.ts';
import type { PracticeGameImportData } from '../../resources/js/generated/data.ts';

/** The version of the calculation in Appendix B that the answers come from. */
export const ANSWERS_VERSION = 1;

export type PracticeOptions = {
    /** The only time control kept, as in the TimeControl tag. */
    timeControl: string;
    /** The rating limit. Both players must be under it. */
    maxRating: number;
    /** The shortest game kept. */
    minPlies: number;
    /** The longest game kept. */
    maxPlies: number;
    /** How many games are chosen. */
    limit: number;
    /** The most games chosen per opening family. */
    perFamily: number;
};

export const DEFAULT_OPTIONS: PracticeOptions = {
    timeControl: '600+0',
    maxRating: 1200,
    minPlies: 30,
    maxPlies: 120,
    limit: 500,
    perFamily: 25,
};

/** The length bands, each with the longest game it holds, in plies. */
export const BANDS = [
    { name: 'short', upTo: 49 },
    { name: 'medium', upTo: 73 },
    { name: 'long', upTo: Infinity },
] as const;

export type BandName = (typeof BANDS)[number]['name'];

/** One game of the source file: its tags and its moves as written. */
export type SourceGame = {
    tags: Record<string, string>;
    moveText: string;
};

const RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

/**
 * Groups the lines of a PGN file into games, so the file can be read as a
 * stream. A game cut off by the end of the file is left out.
 */
export async function* readGames(
    lines: AsyncIterable<string> | Iterable<string>,
): AsyncGenerator<SourceGame> {
    let tags: Record<string, string> = {};
    let moveText: string | null = null;

    for await (const line of lines) {
        if (line.startsWith('[')) {
            // Tags after moves mean the next game has begun.
            if (moveText !== null) {
                yield { tags, moveText };
                tags = {};
                moveText = null;
            }

            const tag = /^\[(\w+) "(.*)"\]$/.exec(line);

            if (tag?.[1] !== undefined) {
                tags[tag[1]] = tag[2] ?? '';
            }
        } else if (line.trim() === '') {
            if (moveText !== null) {
                yield { tags, moveText };
                tags = {};
                moveText = null;
            }
        } else {
            moveText = moveText === null ? line : `${moveText} ${line}`;
        }
    }

    // The last game counts only when its moves reach the result.
    if (
        moveText !== null &&
        RESULTS.includes(moveText.trim().split(/\s+/).at(-1) ?? '')
    ) {
        yield { tags, moveText };
    }
}

/**
 * The moves as written, in standard notation, without move numbers,
 * comments, annotation symbols or the result.
 */
export function writtenMoves(moveText: string): string[] {
    return moveText
        .replace(/\{[^}]*\}/g, ' ')
        .replace(/\d+\.+/g, ' ')
        .replace(/[?!]+/g, '')
        .split(/\s+/)
        .filter((token) => token !== '' && !RESULTS.includes(token));
}

/** The opening family: the Opening tag up to the first colon. */
export function openingFamily(tags: Record<string, string>): string {
    return (tags.Opening ?? '').split(':')[0]?.trim() || '?';
}

/** The band a game of this length belongs to. */
export function bandOf(plies: number): BandName {
    return BANDS.find((band) => plies <= band.upTo)?.name ?? 'long';
}

/**
 * How many games each band takes: a third of the limit each, with the
 * remainder going to the shorter bands.
 */
export function bandShares(limit: number): Record<BandName, number> {
    const third = Math.floor(limit / BANDS.length);
    const extra = limit % BANDS.length;

    return {
        short: third + (extra > 0 ? 1 : 0),
        medium: third + (extra > 1 ? 1 : 0),
        long: third,
    };
}

/** The fingerprint of a practice game: Appendix D. */
export function fingerprint(moves: readonly { uci: string }[]): string {
    return createHash('sha256')
        .update(moves.map((move) => move.uci).join(' '))
        .digest('hex');
}

/** A game that passed the rules and waits to be chosen. */
type Candidate = {
    /** The SHA-256 of the moves as written, which sets the order. */
    key: string;
    whiteRating: number;
    blackRating: number;
    timeControl: string;
    family: string;
    moves: string[];
};

/**
 * Replays a candidate and calculates its answers, or returns null when it
 * does not replay. Only the ratings, the time control and the moves go in:
 * no name and no game link.
 */
function toPracticeGame(candidate: Candidate): PracticeGameImportData | null {
    const pgn = candidate.moves
        .map((move, index) =>
            index % 2 === 0 ? `${String(index / 2 + 1)}. ${move}` : move,
        )
        .join(' ');

    try {
        const replayed = replayPgn(pgn).moves;

        if (replayed.length !== candidate.moves.length) {
            return null;
        }

        const boards = positionsOf(replayed).map((fen) => boardFromFen(fen));
        const moves = replayed.map((move, index) => {
            const parts = parseMove(move.uci);
            const before = boards[index];
            const after = boards[index + 1];

            if (parts === null || before === undefined || after === undefined) {
                throw new Error(`Not a move: ${move.uci}`);
            }

            const answers = calculateMove(before, after, parts);

            return {
                uci: move.uci,
                san: move.san,
                piece: answers.piece,
                lost: [...answers.lost],
                controlled: [...answers.controlled],
                hanging: [...answers.hanging],
            };
        });

        return {
            fingerprint: fingerprint(moves),
            white_rating: candidate.whiteRating,
            black_rating: candidate.blackRating,
            time_control: candidate.timeControl,
            ply_count: moves.length,
            answers_version: ANSWERS_VERSION,
            moves,
        };
    } catch {
        return null;
    }
}

export type PracticeReport = {
    /** How many games the input held. */
    read: number;
    accepted: number;
    /** Skipped games, counted by reason. */
    skipped: Record<string, number>;
    /** Chosen games per length band, with how many each band takes. */
    byBand: Record<BandName, { chosen: number; share: number }>;
    /** Chosen games per opening family. */
    byFamily: Record<string, number>;
};

export type PracticeExtract = {
    /** Takes one game of the file. */
    add: (game: SourceGame) => void;
    /** Chooses the games and returns them with their answers. */
    finish: () => { games: PracticeGameImportData[]; report: PracticeReport };
};

/**
 * Collects the games of a file one at a time, so the file can be read as a
 * stream, and chooses among them at the end.
 */
export function createPracticeExtract(
    options: PracticeOptions,
): PracticeExtract {
    const candidates: Candidate[] = [];
    const skipped: Record<string, number> = {};
    let read = 0;

    const skip = (reason: string, games = 1): void => {
        skipped[reason] = (skipped[reason] ?? 0) + games;
    };

    return {
        add({ tags, moveText }) {
            read += 1;

            const whiteRating = Number(tags.WhiteElo);
            const blackRating = Number(tags.BlackElo);

            if (
                !Number.isInteger(whiteRating) ||
                !Number.isInteger(blackRating)
            ) {
                skip('a rating is missing');

                return;
            }

            if (
                tags.Termination === 'Abandoned' ||
                tags.Termination === 'Rules infraction'
            ) {
                skip('abandoned or a rules infraction');

                return;
            }

            if (tags.TimeControl !== options.timeControl) {
                skip('not the --time-control');

                return;
            }

            if (
                whiteRating >= options.maxRating ||
                blackRating >= options.maxRating
            ) {
                skip('a player not under --max-rating');

                return;
            }

            if (tags.WhiteTitle === 'BOT' || tags.BlackTitle === 'BOT') {
                skip('a bot player');

                return;
            }

            const moves = writtenMoves(moveText);

            if (moves.length < options.minPlies) {
                skip('below --min-plies');

                return;
            }

            if (moves.length > options.maxPlies) {
                skip('above --max-plies');

                return;
            }

            candidates.push({
                key: createHash('sha256').update(moves.join(' ')).digest('hex'),
                whiteRating,
                blackRating,
                timeControl: options.timeControl,
                // Copied, because a piece cut from a line keeps the whole
                // decompressed block it came from in memory.
                family: Buffer.from(openingFamily(tags)).toString(),
                moves,
            });
        },

        finish() {
            // An order that does not depend on the order in the file.
            candidates.sort((a, b) =>
                a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
            );

            const shares = bandShares(options.limit);
            const perBand: Record<BandName, number> = {
                short: 0,
                medium: 0,
                long: 0,
            };
            const byFamily: Record<string, number> = {};
            const fingerprints = new Set<string>();
            const games: PracticeGameImportData[] = [];

            for (const candidate of candidates) {
                const band = bandOf(candidate.moves.length);

                if (
                    perBand[band] >= shares[band] ||
                    (byFamily[candidate.family] ?? 0) >= options.perFamily
                ) {
                    skip('passed the rules but not chosen');

                    continue;
                }

                // The replay is the slow rule, so it comes last.
                const game = toPracticeGame(candidate);

                if (game === null) {
                    skip('illegal move or unreadable moves');

                    continue;
                }

                if (fingerprints.has(game.fingerprint)) {
                    skip('same moves as a game already chosen');

                    continue;
                }

                fingerprints.add(game.fingerprint);
                perBand[band] += 1;
                byFamily[candidate.family] =
                    (byFamily[candidate.family] ?? 0) + 1;
                games.push(game);
            }

            return {
                games,
                report: {
                    read,
                    accepted: games.length,
                    skipped,
                    byBand: {
                        short: { chosen: perBand.short, share: shares.short },
                        medium: {
                            chosen: perBand.medium,
                            share: shares.medium,
                        },
                        long: { chosen: perBand.long, share: shares.long },
                    },
                    byFamily,
                },
            };
        },
    };
}

/** The report as the lines that are printed. */
export function formatReport(report: PracticeReport): string[] {
    const lines = [
        `  Games read      ${String(report.read)}`,
        `  Accepted        ${String(report.accepted)}`,
        `  Skipped         ${String(report.read - report.accepted)}`,
    ];

    for (const [reason, count] of Object.entries(report.skipped).sort(
        ([, a], [, b]) => b - a,
    )) {
        lines.push(`    ${String(count).padStart(8)}  ${reason}`);
    }

    lines.push('', '  Accepted by length band:');

    for (const band of BANDS) {
        const { chosen, share } = report.byBand[band.name];

        lines.push(
            `    ${band.name.padEnd(8)}${String(chosen).padStart(6)} of ${String(share)}`,
        );
    }

    const families = Object.entries(report.byFamily).sort(
        ([a, x], [b, y]) => y - x || a.localeCompare(b),
    );

    lines.push(
        '',
        `  Accepted by opening family (${String(families.length)}):`,
    );

    for (const [family, count] of families) {
        lines.push(`    ${String(count).padStart(6)}  ${family}`);
    }

    return lines;
}
