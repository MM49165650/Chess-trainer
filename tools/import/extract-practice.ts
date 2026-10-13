// The extract stage of the practice game import: Appendix E of
// docs/requirements.md. It reads a Lichess monthly games file while still
// compressed, applies the rules in practice-games.ts and writes the
// intermediate file for import:practice-games.
//
//   npm run extract:practice -- --input <file or folder> --out <file>

import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import {
    DEFAULT_OPTIONS,
    createPracticeExtract,
    formatReport,
    readGames,
} from './practice-games.ts';
import { readLines } from './read-lines.ts';

const { values } = parseArgs({
    options: {
        input: { type: 'string' },
        out: { type: 'string' },
        'time-control': { type: 'string' },
        'max-rating': { type: 'string' },
        'min-plies': { type: 'string' },
        'max-plies': { type: 'string' },
        limit: { type: 'string' },
        'per-family': { type: 'string' },
    },
});

if (values.input === undefined || values.out === undefined) {
    console.error(
        'Usage: npm run extract:practice -- --input <file or folder> --out <file>\n' +
            '       [--time-control <text>] [--max-rating <number>]\n' +
            '       [--min-plies <number>] [--max-plies <number>]\n' +
            '       [--limit <number>] [--per-family <number>]',
    );
    process.exit(1);
}

function numberOption(name: string, fallback: number): number {
    const text = (values as Record<string, string | undefined>)[name];
    const value = text === undefined ? fallback : Number(text);

    if (!Number.isInteger(value)) {
        console.error(`--${name} must be a whole number.`);
        process.exit(1);
    }

    return value;
}

const options = {
    timeControl: values['time-control'] ?? DEFAULT_OPTIONS.timeControl,
    maxRating: numberOption('max-rating', DEFAULT_OPTIONS.maxRating),
    minPlies: numberOption('min-plies', DEFAULT_OPTIONS.minPlies),
    maxPlies: numberOption('max-plies', DEFAULT_OPTIONS.maxPlies),
    limit: numberOption('limit', DEFAULT_OPTIONS.limit),
    perFamily: numberOption('per-family', DEFAULT_OPTIONS.perFamily),
};

// A folder means every games file in it, compressed or not.
const files = statSync(values.input).isDirectory()
    ? readdirSync(values.input)
          .filter((name) => /\.pgn(\.zst)?$/i.test(name))
          .sort()
          .map((name) => join(values.input ?? '', name))
    : [values.input];

const extract = createPracticeExtract(options);

for (const file of files) {
    for await (const game of readGames(readLines(file))) {
        extract.add(game);
    }
}

const { games, report } = extract.finish();

// JSON Lines: a header naming the content, then one game per line.
const header = {
    kind: 'practice_games',
    format: 1,
    options: {
        time_control: options.timeControl,
        max_rating: options.maxRating,
        min_plies: options.minPlies,
        max_plies: options.maxPlies,
        limit: options.limit,
        per_family: options.perFamily,
    },
};

mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(
    values.out,
    [header, ...games].map((line) => JSON.stringify(line)).join('\n') + '\n',
);

console.log(`Practice games extracted from ${String(files.length)} file(s)`);

for (const file of files) {
    console.log(`  ${file}`);
}

console.log('');
console.log(formatReport(report).join('\n'));
console.log('');
console.log(`  Written to ${values.out}`);
