import { createInertiaApp } from '@inertiajs/vue3';
import type { DefineComponent } from 'vue';
import { trackHistory } from './navigation';
import { applySettingsToPage } from './settings/applyToPage';
import { SITE_NAME } from './site';

applySettingsToPage();
trackHistory();

type PageModule = { default: DefineComponent };

const pages = import.meta.glob<PageModule>('./pages/**/*.vue');

// The development-only pages. A production build leaves their code out
// altogether: the condition is known at build time, so the import is dropped.
const devPages =
    import.meta.env.MODE === 'production'
        ? {}
        : import.meta.glob<PageModule>('./dev/**/*.vue');

void createInertiaApp({
    title: (title: string) => (title ? `${title} - ${SITE_NAME}` : SITE_NAME),
    resolve: async (name: string) => {
        const load = pages[`./pages/${name}.vue`] ?? devPages[`./${name}.vue`];

        if (load === undefined) {
            throw new Error(`Page not found: ${name}`);
        }

        return (await load()).default;
    },
});
