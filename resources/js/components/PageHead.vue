<script setup lang="ts">
// A page's title and description, from what the server says about the page.
// The template has already printed both in the page source; this keeps them
// right as the user moves from page to page.

import { Head } from '@inertiajs/vue3';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <Head :title="meta.title">
        <meta
            v-if="meta.description !== null"
            head-key="description"
            name="description"
            :content="meta.description"
        />
    </Head>
</template>
