// The settings that apply to the whole page rather than to one board: the
// appearance, and the marking palette, which also colours the phase tabs and
// the legend. Both are attributes on the root element, read by the tokens.

import { watchEffect } from 'vue';
import { useSettings } from './useSettings';

export function applySettingsToPage(): void {
    const settings = useSettings();
    const root = document.documentElement;

    watchEffect(() => {
        if (settings.appearance === 'system') {
            delete root.dataset.appearance;
        } else {
            root.dataset.appearance = settings.appearance;
        }

        root.dataset.palette = settings.markingPalette;
    });
}
