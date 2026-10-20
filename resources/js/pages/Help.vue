<script setup lang="ts">
// The help page: where progress is kept, what can lose it, and how to install
// the site.

import { Link } from '@inertiajs/vue3';
import ShowProgressController from '@/actions/App/Http/Controllers/ShowProgressController';
import TextPage from '@/components/TextPage.vue';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <TextPage :meta="meta">
        <h2>Where your progress is kept</h2>
        <p>
            Your scores, your games in progress and your settings are saved in
            this browser, on this device. Nothing is sent to us, and there is no
            account. Your progress stays when you close the page, turn the
            device off, or the site is updated.
        </p>

        <h2>What can lose it</h2>
        <p>
            Clearing your browser's data for this site, often called "cookies
            and site data" or "website data".
        </p>
        <p>
            A private or incognito window: progress lasts only until it is
            closed.
        </p>
        <p>
            Another browser or another device: each starts from the beginning,
            and they do not share progress.
        </p>
        <p>
            Safari on iPhone, iPad and Mac can delete a site's saved data after
            you use Safari for seven days without visiting it. Visiting
            regularly, or installing the site, avoids this.
        </p>
        <p>
            "Reset progress" on the
            <Link :href="ShowProgressController.url()">progress page</Link>,
            which clears it on purpose.
        </p>

        <h2>Installing the site</h2>
        <p>
            You can add the site to your home screen or desktop. It then opens
            in its own window, without the address bar, like an app.
        </p>
        <p>
            Android: in Chrome, open the menu (⋮) and choose "Install app" or
            "Add to Home screen".
        </p>
        <p>
            iPhone and iPad: in Safari, tap the Share button and choose "Add to
            Home Screen".
        </p>
        <p>
            Computer: in Chrome or Edge, click the install icon at the right of
            the address bar, or choose "Install" from the menu.
        </p>
        <p>
            On iPhone and iPad, the installed site is not affected by Safari's
            seven-day rule. It may keep its own progress, separate from
            Safari's; we have not been able to test this yet. To be safe, pick
            one, Safari or the installed site, and play there.
        </p>

        <h2>Moving to a new device</h2>
        <p>
            There are no accounts yet, so progress cannot be moved from one
            device or browser to another.
        </p>
    </TextPage>
</template>
