// The rules of the master game extract: Appendix E of docs/requirements.md.
// It turns the text of PGN files into the games for the intermediate file,
// with a report of what was kept and what was skipped. Reading and writing
// files is left to extract-masters.ts.

import { createHash } from 'node:crypto';
import { replayPgn } from '../../resources/js/chess/replay.ts';
import type { MasterGameImportData } from '../../resources/js/generated/data.ts';

/** Each master's slug, with the name spellings found in the sources. */
export type MasterNames = Record<string, string[]>;

export type ExtractOptions = {
    /** The shortest game kept, in plies. */
    minPlies: number;
    /** Words in the event or site that exclude a game. */
    excludeEvents: string[];
};

export const DEFAULT_OPTIONS: ExtractOptions = {
    minPlies: 0,
    excludeEvents: ['simul', 'sim', 'blindfold', 'odds', 'consultation'],
};

export type ExtractReport = {
    /** How many games the input held. */
    read: number;
    accepted: number;
    /** Skipped games, counted by reason. */
    skipped: Record<string, number>;
    /** Winners that match no master, counted by name. */
    unmatchedWinners: Record<string, number>;
    /** Games excluded by an event word, counted by word and event. */
    excludedEvents: { word: string; event: string; games: number }[];
    /** Accepted games whose moves are the beginning of another game. */
    possibleDuplicates: { shorter: string; longer: string }[];
};

export type ExtractResult = {
    games: MasterGameImportData[];
    report: ExtractReport;
};

/** Splits the text of a PGN file into its games. */
export function splitGames(text: string): string[] {
    return text
        .replaceAll('\r\n', '\n')
        .split(/\n\s*\n(?=\[Event )/)
        .map((game) => game.trim())
        .filter((game) => game !== '');
}

/** Rewrites "Last, First" as "First Last". Other names are left as they are. */
export function firstNameFirst(name: string): string {
    const [last, ...rest] = name.split(',').map((part) => part.trim());
    const first = rest.join(' ').trim();

    return first === '' ? (last ?? name) : `${first} ${last ?? ''}`.trim();
}

/** The first excluded word that appears as a whole word in the text. */
function excludedWord(text: string, words: string[]): string | null {
    return (
        words.find((word) =>
            new RegExp(
                `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
                'i',
            ).test(text),
        ) ?? null
    );
}

/** The value of a PGN tag, or an empty string when the tag is missing. */
function tag(game: string, name: string): string {
    return (
        new RegExp(`^\\[${name} "(.*)"\\]`, 'm').exec(game)?.[1]?.trim() ?? ''
    );
}

function hasTag(game: string, name: string): boolean {
    return new RegExp(`^\\[${name} `, 'm').test(game);
}

/** SHA-256 of the master's slug, colour and moves: Appendix D. */
export function fingerprint(
    slug: string,
    color: 'white' | 'black',
    moves: string[],
): string {
    return createHash('sha256')
        .update(`${slug}|${color}|${moves.join(' ')}`)
        .digest('hex');
}

export function extractMasterGames(
    texts: string[],
    masters: MasterNames,
    options: ExtractOptions,
): ExtractResult {
    const slugByName = new Map<string, string>();

    for (const [slug, names] of Object.entries(masters)) {
        for (const name of names) {
            slugByName.set(name, slug);
        }
    }

    const games: MasterGameImportData[] = [];
    const labels = new Map<string, string>();
    const moveText = new Map<string, string>();
    const skipped: Record<string, number> = {};
    const unmatchedWinners: Record<string, number> = {};
    const excluded = new Map<
        string,
        { word: string; event: string; games: number }
    >();
    let read = 0;

    const skip = (reason: string): void => {
        skipped[reason] = (skipped[reason] ?? 0) + 1;
    };

    for (const pgn of texts.flatMap(splitGames)) {
        read += 1;

        const event = tag(pgn, 'Event');
        const word = excludedWord(
            `${event} ${tag(pgn, 'Site')}`,
            options.excludeEvents,
        );

        if (word !== null) {
            const key = `${word}|${event}`;
            const entry = excluded.get(key) ?? { word, event, games: 0 };

            entry.games += 1;
            excluded.set(key, entry);
            skip('excluded event');
            continue;
        }

        const result = tag(pgn, 'Result');

        if (result === '1/2-1/2') {
            skip('draw');
            continue;
        }

        if (result !== '1-0' && result !== '0-1') {
            skip('no result');
            continue;
        }

        const masterColor = result === '1-0' ? 'white' : 'black';
        const winner = tag(pgn, masterColor === 'white' ? 'White' : 'Black');
        const opponent = tag(pgn, masterColor === 'white' ? 'Black' : 'White');
        const slug = slugByName.get(winner);

        if (slug === undefined) {
            unmatchedWinners[winner] = (unmatchedWinners[winner] ?? 0) + 1;
            skip('winner is not a master');
            continue;
        }

        if (hasTag(pgn, 'SetUp') || hasTag(pgn, 'FEN')) {
            skip('custom starting position');
            continue;
        }

        let moves;

        try {
            moves = replayPgn(pgn).moves;
        } catch {
            skip('illegal move or unreadable game');
            continue;
        }

        if (moves.length === 0) {
            skip('no moves');
            continue;
        }

        if (moves.length < options.minPlies) {
            skip('shorter than --min-plies');
            continue;
        }

        const uci = moves.map((move) => move.uci);
        const print = fingerprint(slug, masterColor, uci);

        if (labels.has(print)) {
            skip('duplicate of another game in this run');
            continue;
        }

        const date = tag(pgn, 'Date');
        const year = /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : null;

        labels.set(
            print,
            `${winner} vs. ${opponent}, ${event}${year === null ? '' : ` ${String(year)}`}`,
        );
        moveText.set(print, `${slug}|${masterColor}|${uci.join(' ')}`);

        games.push({
            master_slug: slug,
            fingerprint: print,
            master_color: masterColor,
            opponent_name: firstNameFirst(opponent),
            year,
            event: event === '' || event === '?' ? null : event,
            ply_count: moves.length,
            guess_count:
                masterColor === 'white'
                    ? Math.ceil(moves.length / 2)
                    : Math.floor(moves.length / 2),
            moves,
        });
    }

    return {
        games,
        report: {
            read,
            accepted: games.length,
            skipped,
            unmatchedWinners,
            excludedEvents: [...excluded.values()],
            possibleDuplicates: possibleDuplicates(moveText, labels),
        },
    };
}

// A game whose moves are the beginning of another game by the same master
// and colour may be the same game cut short. They are listed, not removed.
function possibleDuplicates(
    moveText: Map<string, string>,
    labels: Map<string, string>,
): { shorter: string; longer: string }[] {
    const sorted = [...moveText.entries()].sort(([, a], [, b]) =>
        a < b ? -1 : a > b ? 1 : 0,
    );
    const found: { shorter: string; longer: string }[] = [];

    // After sorting, a game that begins another sits directly before the
    // games it begins.
    sorted.forEach(([print, text], index) => {
        for (const [otherPrint, otherText] of sorted.slice(index + 1)) {
            if (!otherText.startsWith(`${text} `)) {
                break;
            }

            found.push({
                shorter: labels.get(print) ?? print,
                longer: labels.get(otherPrint) ?? otherPrint,
            });
        }
    });

    return found;
}

/** The report as the lines that are printed. */
export function formatReport(report: ExtractReport): string[] {
    const lines = [
        `  Games read      ${String(report.read)}`,
        `  Accepted        ${String(report.accepted)}`,
        `  Skipped         ${String(report.read - report.accepted)}`,
    ];

    const byCount = (entries: [string, number][]): [string, number][] =>
        entries.sort(([, a], [, b]) => b - a);

    for (const [reason, count] of byCount(Object.entries(report.skipped))) {
        lines.push(`    ${String(count).padStart(5)}  ${reason}`);
    }

    lines.push('', '  Excluded by a word in the event or site:');

    if (report.excludedEvents.length === 0) {
        lines.push('    none');
    }

    for (const entry of report.excludedEvents.sort(
        (a, b) => b.games - a.games,
    )) {
        lines.push(
            `    ${String(entry.games).padStart(5)}  ${entry.event}  (word: ${entry.word})`,
        );
    }

    lines.push('', '  Winners that match no master:');

    if (Object.keys(report.unmatchedWinners).length === 0) {
        lines.push('    none');
    }

    for (const [name, count] of byCount(
        Object.entries(report.unmatchedWinners),
    )) {
        lines.push(`    ${String(count).padStart(5)}  ${name}`);
    }

    lines.push('', '  Possible duplicates (one game begins the other):');

    if (report.possibleDuplicates.length === 0) {
        lines.push('    none');
    }

    for (const pair of report.possibleDuplicates) {
        lines.push(`    ${pair.shorter}`, `      begins: ${pair.longer}`);
    }

    return lines;
}
