<script setup lang="ts">
// A page of plain text, such as about, credits and privacy: the back arrow to
// the home page, the heading, and the text in the slot.

import { Link } from '@inertiajs/vue3';
import PageHead from '@/components/PageHead.vue';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <PageHead :meta="meta" />

    <main class="pb-10 sm:mx-auto sm:w-[560px]">
        <header class="flex items-center p-1">
            <Link
                href="/"
                class="flex size-11 flex-none items-center justify-center"
                aria-label="Back to home"
            >
                <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M15 5l-7 7 7 7" />
                </svg>
            </Link>
        </header>

        <div class="px-5 pt-2">
            <h1 class="font-serif text-display tracking-heading">
                {{ meta.heading }}
            </h1>
        </div>

        <div class="running-text px-5">
            <slot />
        </div>
    </main>
</template>

<style scoped>
/* Plain running text: paragraphs, small headings over each part, and links
   that read as links without hovering. */
.running-text :deep(p) {
    margin-top: 12px;
    max-width: 34rem;
    font-size: var(--text-button);
    line-height: 1.5;
}

.running-text :deep(h2) {
    margin-top: 32px;
    color: var(--color-muted);
    font-size: var(--text-label);
    font-weight: 600;
    line-height: var(--text-label--line-height);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
}

.running-text :deep(a) {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
