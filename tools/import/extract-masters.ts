// The extract stage of the master game import: Appendix E of
// docs/requirements.md. It reads PGN files, applies the rules in
// master-games.ts and writes the intermediate file for import:master-games.
//
//   npm run extract:masters -- --input <file or folder> --out <file>

import {
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import {
    DEFAULT_OPTIONS,
    extractMasterGames,
    formatReport,
    type MasterNames,
} from './master-games.ts';

const { values } = parseArgs({
    options: {
        input: { type: 'string' },
        out: { type: 'string' },
        'min-plies': { type: 'string' },
        'exclude-events': { type: 'string' },
    },
});

if (values.input === undefined || values.out === undefined) {
    console.error(
        'Usage: npm run extract:masters -- --input <file or folder> --out <file>\n' +
            '       [--min-plies <number>] [--exclude-events <word,word,...>]',
    );
    process.exit(1);
}

const options = {
    minPlies:
        values['min-plies'] === undefined
            ? DEFAULT_OPTIONS.minPlies
            : Number(values['min-plies']),
    excludeEvents:
        values['exclude-events'] === undefined
            ? DEFAULT_OPTIONS.excludeEvents
            : values['exclude-events']
                  .split(',')
                  .map((word) => word.trim())
                  .filter((word) => word !== ''),
};

if (!Number.isInteger(options.minPlies) || options.minPlies < 0) {
    console.error('--min-plies must be a whole number, 0 or more.');
    process.exit(1);
}

// A folder means every PGN file in it.
const files = statSync(values.input).isDirectory()
    ? readdirSync(values.input)
          .filter((name) => name.toLowerCase().endsWith('.pgn'))
          .sort()
          .map((name) => join(values.input ?? '', name))
    : [values.input];

const masters = JSON.parse(
    readFileSync(join(import.meta.dirname, 'masters.json'), 'utf8'),
) as MasterNames;

const { games, report } = extractMasterGames(
    files.map((file) => readFileSync(file, 'utf8')),
    masters,
    options,
);

// JSON Lines: a header naming the content, then one game per line.
const header = {
    kind: 'master_games',
    format: 1,
    options: {
        min_plies: options.minPlies,
        exclude_events: options.excludeEvents,
    },
};

mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(
    values.out,
    [header, ...games].map((line) => JSON.stringify(line)).join('\n') + '\n',
);

console.log(`Master games extracted from ${String(files.length)} file(s)`);

for (const file of files) {
    console.log(`  ${file}`);
}

console.log('');
console.log(formatReport(report).join('\n'));
console.log('');
console.log(`  Written to ${values.out}`);
