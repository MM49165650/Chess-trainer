<script setup lang="ts">
// The site's own not-found page, for an address that matches no page or
// names a master or game that does not exist.

import { Link } from '@inertiajs/vue3';
import PageHead from '@/components/PageHead.vue';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <PageHead :meta="meta" />

    <main
        class="flex flex-col items-start gap-3 px-5 pt-10 sm:mx-auto sm:w-[560px]"
    >
        <p class="label-caps text-muted">Not found</p>
        <h1 class="font-serif text-display tracking-heading">
            This page is not here.
        </h1>
        <p class="text-muted">
            The address may be mistyped, or the page may have moved.
        </p>
        <Link
            href="/"
            class="mt-3 flex h-11 items-center rounded-pill bg-accent px-4 text-button font-semibold text-on-accent"
        >
            Go to the home page
        </Link>
    </main>
</template>
