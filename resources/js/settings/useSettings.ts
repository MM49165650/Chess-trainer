// The settings as the pages use them: one shared copy, read from storage once
// per visit, that every page and board follows. A change takes effect at once
// and is saved. Without storage, a change still lasts for the visit.

import { reactive, readonly } from 'vue';
import {
    DEFAULT_SETTINGS,
    readSettings,
    saveSettings,
} from '@/storage/settings';
import type { Settings } from '@/storage/types';

const settings = reactive<Settings>({ ...DEFAULT_SETTINGS });

/** Settings changed before the saved ones arrived, which those must not undo. */
const changedEarly = new Set<keyof Settings>();

let loading: Promise<void> | null = null;

/**
 * The appearance is also copied to localStorage, so that a small script in
 * the page head can apply it before anything is drawn. IndexedDB stays the
 * real store; this copy only prevents a flash of the wrong mode on a reload.
 */
export const APPEARANCE_COPY_KEY = 'chess-training:appearance';

function copyAppearance(appearance: Settings['appearance']): void {
    try {
        if (appearance === 'system') {
            localStorage.removeItem(APPEARANCE_COPY_KEY);
        } else {
            localStorage.setItem(APPEARANCE_COPY_KEY, appearance);
        }
    } catch {
        // Without localStorage the page may show the device's mode briefly.
    }
}

/** Reads the saved settings, the first time it is asked for. */
export function loadSettings(): Promise<void> {
    loading ??= readSettings().then((saved) => {
        for (const key of Object.keys(saved) as (keyof Settings)[]) {
            if (!changedEarly.has(key)) {
                Object.assign(settings, { [key]: saved[key] });
            }
        }

        copyAppearance(settings.appearance);
    });

    return loading;
}

/**
 * Changes one setting at once and saves it. The answer is whether it was
 * saved; when it was not, the change still holds until the page is left.
 */
export async function changeSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K],
): Promise<boolean> {
    changedEarly.add(key);
    Object.assign(settings, { [key]: value });

    const saved = await saveSettings({ [key]: value });

    if (saved && key === 'appearance') {
        copyAppearance(settings.appearance);
    }

    return saved;
}

/** The settings, read-only: change one with changeSetting. */
export function useSettings(): Readonly<Settings> {
    void loadSettings();

    return readonly(settings);
}
