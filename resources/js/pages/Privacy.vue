<script setup lang="ts">
// The privacy page: what the site keeps, and where. Progress stays in the
// browser, and Cloudflare's analytics count visits without cookies.

import TextPage from '@/components/TextPage.vue';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <TextPage :meta="meta">
        <p>
            There are no accounts and no cookies. The site does not know who you
            are.
        </p>

        <h2>Your progress</h2>
        <p>
            Your scores, your games in progress and your settings are kept only
            in this browser, on this device. They are never sent to the site's
            server or to anyone else. Clearing the browser's data deletes them,
            and the reset button on the progress page clears your scores
            whenever you like.
        </p>

        <h2>Analytics</h2>
        <p>
            The site uses Cloudflare Web Analytics to count visits and see which
            pages are used. It sets no cookies and does not follow you from site
            to site.
        </p>

        <h2>Fonts</h2>
        <p>
            The fonts are served by the site itself, so loading a page sends no
            request to Google or any other font service.
        </p>
    </TextPage>
</template>
