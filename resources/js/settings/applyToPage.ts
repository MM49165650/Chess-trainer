// The settings that apply to the whole page rather than to one board: the
// appearance, and the marking palette, which also colours the phase tabs and
// the legend. Both are attributes on the root element, read by the tokens.

import { watchEffect } from 'vue';
import type { Settings } from '@/storage/types';
import { useSettings } from './useSettings';

/**
 * The browser's own bar takes its colour from the theme-color tags in the
 * page head, one per mode, each chosen by the device's mode. A mode set in
 * the settings picks its tag instead, so the bar matches the page.
 */
function followAppearanceInThemeColour(
    appearance: Settings['appearance'],
): void {
    const tags = document.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]',
    );

    for (const tag of tags) {
        const mode = tag.dataset.mode;

        if (appearance === 'system') {
            tag.media = `(prefers-color-scheme: ${mode ?? 'light'})`;
        } else {
            tag.media = mode === appearance ? 'all' : 'not all';
        }
    }
}

export function applySettingsToPage(): void {
    const settings = useSettings();
    const root = document.documentElement;

    watchEffect(() => {
        if (settings.appearance === 'system') {
            delete root.dataset.appearance;
        } else {
            root.dataset.appearance = settings.appearance;
        }

        followAppearanceInThemeColour(settings.appearance);

        root.dataset.palette = settings.markingPalette;
    });
}
