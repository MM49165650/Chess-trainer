// Reads a text file one line at a time, so a large source file never has to
// fit in memory. A file ending in .zst is read while still compressed.

import { closeSync, openSync, readSync, createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { createZstdDecompress, zstdDecompressSync } from 'node:zlib';

// Lichess compresses its files in many separate frames, each one announced
// by a "skippable" frame that holds the size of the frame after it. Node's
// streaming reader stops at a skippable frame, so the frames are read one by
// one here.
const SKIPPABLE_MAGIC = 0x184d2a50;
const ZSTD_MAGIC = 0xfd2fb528;

function* compressedChunks(path: string): Generator<Buffer> {
    const file = openSync(path, 'r');

    const read = (length: number, position: number): Buffer => {
        const buffer = Buffer.alloc(length);
        const got = readSync(file, buffer, 0, length, position);

        return buffer.subarray(0, got);
    };

    try {
        let position = 0;
        let nextFrameSize: number | null = null;

        for (;;) {
            const start = read(8, position);

            if (start.length === 0) {
                return;
            }

            if (start.length < 8) {
                throw new Error(`${path} ends in the middle of a frame.`);
            }

            const magic = start.readUInt32LE(0);

            // The sixteen skippable magic numbers differ in the last digit.
            if (magic >>> 4 === SKIPPABLE_MAGIC >>> 4) {
                const length = start.readUInt32LE(4);
                const content = read(length, position + 8);

                nextFrameSize = length === 4 ? content.readUInt32LE(0) : null;
                position += 8 + length;
                continue;
            }

            if (magic !== ZSTD_MAGIC || nextFrameSize === null) {
                throw new Error(
                    `${path} is not a zstd file written in sized frames, as Lichess's files are.`,
                );
            }

            const frame = read(nextFrameSize, position);

            if (frame.length < nextFrameSize) {
                throw new Error(`${path} ends in the middle of a frame.`);
            }

            yield zstdDecompressSync(frame);

            position += nextFrameSize;
            nextFrameSize = null;
        }
    } finally {
        closeSync(file);
    }
}

function* compressedLines(path: string): Generator<string> {
    const decoder = new TextDecoder('utf-8');
    let rest = '';

    for (const chunk of compressedChunks(path)) {
        const lines = (rest + decoder.decode(chunk, { stream: true })).split(
            '\n',
        );

        rest = lines.pop() ?? '';

        for (const line of lines) {
            yield line.endsWith('\r') ? line.slice(0, -1) : line;
        }
    }

    rest += decoder.decode();

    if (rest !== '') {
        yield rest;
    }
}

/** Whether a compressed file starts with a frame that announces a size. */
function hasSizedFrames(path: string): boolean {
    const file = openSync(path, 'r');

    try {
        const start = Buffer.alloc(4);

        return (
            readSync(file, start, 0, 4, 0) === 4 &&
            start.readUInt32LE(0) >>> 4 === SKIPPABLE_MAGIC >>> 4
        );
    } finally {
        closeSync(file);
    }
}

/** The lines of a file, in order, without their line endings. */
export async function* readLines(path: string): AsyncGenerator<string> {
    const compressed = path.toLowerCase().endsWith('.zst');

    if (compressed && hasSizedFrames(path)) {
        yield* compressedLines(path);

        return;
    }

    yield* createInterface({
        input: compressed
            ? createReadStream(path).pipe(createZstdDecompress())
            : createReadStream(path, 'utf8'),
        crlfDelay: Infinity,
    });
}
