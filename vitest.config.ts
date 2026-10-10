import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        include: ['resources/js/**/*.test.ts', 'tools/**/*.test.ts'],
        // The first TypeScript tests are the golden tests of build step 6.
        passWithNoTests: true,
    },
});
