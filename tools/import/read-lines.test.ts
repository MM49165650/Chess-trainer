// A file packed in several zstd frames, the way Lichess packs its files,
// reads as the same lines as the same file packed in one frame.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zstdCompressSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { readLines } from './read-lines.ts';

const LINES = [
    'PuzzleId,FEN,Moves',
    'aaaaa,made up,e2e4 e7e5',
    'bbbbb,café,g1f3',
];

/** One frame, announced by a skippable frame that holds its size. */
function sizedFrame(content: Buffer): Buffer {
    const frame = zstdCompressSync(content);
    const announcement = Buffer.alloc(12);

    announcement.writeUInt32LE(0x184d2a50, 0);
    announcement.writeUInt32LE(4, 4);
    announcement.writeUInt32LE(frame.length, 8);

    return Buffer.concat([announcement, frame]);
}

async function linesOf(path: string): Promise<string[]> {
    const lines: string[] = [];

    for await (const line of readLines(path)) {
        lines.push(line);
    }

    return lines;
}

test('several zstd frames read as the same lines as one frame', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'read-lines-'));
    const text = Buffer.from(LINES.join('\n') + '\n', 'utf8');

    // The first cut falls inside the second line, and the second cut falls
    // inside the two-byte letter of the third.
    const cuts = [25, text.indexOf('é') + 1];
    const parts = [
        text.subarray(0, cuts[0]),
        text.subarray(cuts[0], cuts[1]),
        text.subarray(cuts[1]),
    ];

    const oneFrame = join(folder, 'one.csv.zst');
    const severalFrames = join(folder, 'several.csv.zst');

    writeFileSync(oneFrame, zstdCompressSync(text));
    writeFileSync(severalFrames, Buffer.concat(parts.map(sizedFrame)));

    expect(await linesOf(oneFrame)).toEqual(LINES);
    expect(await linesOf(severalFrames)).toEqual(LINES);
});
