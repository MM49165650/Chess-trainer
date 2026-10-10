import { createInertiaApp } from '@inertiajs/vue3';

const appName = import.meta.env.VITE_APP_NAME || 'Chess training';

void createInertiaApp({
    title: (title: string) => (title ? `${title} - ${appName}` : appName),
});
