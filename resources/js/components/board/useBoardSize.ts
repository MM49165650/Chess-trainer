// The board size chosen with the resize handle: one value for every play
// screen, kept in the settings. A screen is re-created for each new game or
// puzzle, so the value lives here and not in the screen.

import { onMounted, ref, type Ref } from 'vue';
import { readSettings, saveSettings } from '@/storage/settings';
import type { Settings } from '@/storage/types';

type BoardSize = {
    /** The chosen width in pixels; null means the default. */
    size: Ref<number | null>;
    /** Reads the saved size, the first time it is asked for. */
    load: () => Promise<void>;
    /** Saves the size as it stands: called when a resize ends. */
    save: () => void;
};

export function createBoardSize(
    read: () => Promise<Partial<Settings>>,
    write: (changes: Partial<Settings>) => Promise<boolean>,
): BoardSize {
    const size = ref<number | null>(null);

    let asked = false;
    let resized = false;

    async function load(): Promise<void> {
        if (asked) {
            return;
        }

        asked = true;

        const saved = (await read()).boardSizePx;

        // Unless the user has resized the board before this arrives.
        if (saved !== undefined && !resized) {
            size.value = saved;
        }
    }

    function save(): void {
        resized = true;

        // Without storage the size still lasts until the page is left.
        void write({ boardSizePx: size.value });
    }

    return { size, load, save };
}

const shared = createBoardSize(readSettings, saveSettings);

export function useBoardSize() {
    onMounted(() => {
        void shared.load();
    });

    return { boardSize: shared.size, saveBoardSize: shared.save };
}
