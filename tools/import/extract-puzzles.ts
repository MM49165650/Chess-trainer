// The extract stage of the puzzle import: Appendix E of docs/requirements.md.
// It reads the Lichess puzzle file, applies the rules in puzzles.ts and
// writes the intermediate file for import:puzzles.
//
//   npm run extract:puzzles -- --input <file or folder> --out <file>

import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import {
    DEFAULT_OPTIONS,
    createPuzzleExtract,
    formatReport,
    readColumns,
    type ColumnPositions,
} from './puzzles.ts';
import { readLines } from './read-lines.ts';

const { values } = parseArgs({
    options: {
        input: { type: 'string' },
        out: { type: 'string' },
        'max-rating': { type: 'string' },
        'min-popularity': { type: 'string' },
        'min-plays': { type: 'string' },
        'per-category': { type: 'string' },
    },
});

if (values.input === undefined || values.out === undefined) {
    console.error(
        'Usage: npm run extract:puzzles -- --input <file or folder> --out <file>\n' +
            '       [--max-rating <number>] [--min-popularity <number>]\n' +
            '       [--min-plays <number>] [--per-category <number>]',
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
    maxRating: numberOption('max-rating', DEFAULT_OPTIONS.maxRating),
    minPopularity: numberOption(
        'min-popularity',
        DEFAULT_OPTIONS.minPopularity,
    ),
    minPlays: numberOption('min-plays', DEFAULT_OPTIONS.minPlays),
    perCategory: numberOption('per-category', DEFAULT_OPTIONS.perCategory),
};

// A folder means every puzzle file in it, compressed or not.
const files = statSync(values.input).isDirectory()
    ? readdirSync(values.input)
          .filter((name) => /\.csv(\.zst)?$/i.test(name))
          .sort()
          .map((name) => join(values.input ?? '', name))
    : [values.input];

const extract = createPuzzleExtract(options);

for (const file of files) {
    let columns: ColumnPositions | null = null;

    for await (const line of readLines(file)) {
        // Each file starts with its column names.
        if (columns === null) {
            columns = readColumns(line);
        } else if (line !== '') {
            extract.add(line, columns);
        }
    }
}

const { puzzles, report } = extract.finish();

// JSON Lines: a header naming the content, then one puzzle per line.
const header = {
    kind: 'puzzles',
    format: 1,
    options: {
        max_rating: options.maxRating,
        min_popularity: options.minPopularity,
        min_plays: options.minPlays,
        per_category: options.perCategory,
    },
};

mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(
    values.out,
    [header, ...puzzles].map((line) => JSON.stringify(line)).join('\n') + '\n',
);

console.log(`Puzzles extracted from ${String(files.length)} file(s)`);

for (const file of files) {
    console.log(`  ${file}`);
}

console.log('');
console.log(formatReport(report).join('\n'));
console.log('');
console.log(`  Written to ${values.out}`);
