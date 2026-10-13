// The board size chosen with the resize handle: saved when a resize ends,
// and still there for the next puzzle and the next visit. The settings store
// is made up for the test.

import { expect, test } from 'vitest';
import type { Settings } from '@/storage/types';
import { createBoardSize } from './useBoardSize';

function settingsStore(stored: Partial<Settings> = {}) {
    const counts = { reads: 0, writes: 0 };

    return {
        stored,
        counts,
        read: (): Promise<Partial<Settings>> => {
            counts.reads += 1;

            return Promise.resolve({ ...stored });
        },
        write: (changes: Partial<Settings>): Promise<boolean> => {
            counts.writes += 1;
            Object.assign(stored, changes);

            return Promise.resolve(true);
        },
    };
}

test('the board size survives moving to the next puzzle', async () => {
    const store = settingsStore();
    const board = createBoardSize(store.read, store.write);

    // The first puzzle opens with nothing saved: the default size.
    await board.load();
    expect(board.size.value).toBeNull();

    // A drag changes the size many times, and saves none of them.
    board.size.value = 520;
    board.size.value = 500;
    board.size.value = 480;
    expect(store.counts.writes).toBe(0);

    // The drag ends: the size it ended on is saved, once.
    board.save();
    expect(store.counts.writes).toBe(1);
    expect(store.stored.boardSizePx).toBe(480);

    // The next puzzle's screen is new and asks again. The size is as it was
    // left, and the settings are not read a second time.
    await board.load();
    expect(board.size.value).toBe(480);
    expect(store.counts.reads).toBe(1);
});

test('the saved board size is there on the next visit, in every mode', async () => {
    const store = settingsStore({ boardSizePx: 640 });

    // One shared value serves all three play screens.
    const board = createBoardSize(store.read, store.write);

    await board.load();
    expect(board.size.value).toBe(640);
});

test('a resize made before the settings arrive is not overwritten', async () => {
    const store = settingsStore({ boardSizePx: 640 });
    const board = createBoardSize(store.read, store.write);

    const loading = board.load();

    board.size.value = 400;
    board.save();
    await loading;

    expect(board.size.value).toBe(400);
    expect(store.stored.boardSizePx).toBe(400);
});
