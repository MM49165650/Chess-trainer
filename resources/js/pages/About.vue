<script setup lang="ts">
// The about page: what the site is, what each mode is for, and where the
// user's progress is kept. A short plain draft, for the owner to edit.

import { Link } from '@inertiajs/vue3';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowPrivacyController from '@/actions/App/Http/Controllers/ShowPrivacyController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import TextPage from '@/components/TextPage.vue';
import type { PageMetaData } from '@/generated/data';
import { SITE_NAME, SOURCE_CODE_URL } from '@/site';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <TextPage :meta="meta">
        <p>
            {{ SITE_NAME }} is a free chess trainer, made for a few friends who
            want to get better at chess. There is nothing to sign up for, no
            adverts and nothing to pay.
        </p>

        <h2>The four modes</h2>
        <p>
            <Link :href="ListMastersController.url()">Guess the move</Link>
            puts you in a master's chair. Play through one of their wins and
            guess each move they made, to learn how strong players think.
        </p>
        <p>
            <Link :href="ListTacticsCategoriesController.url()">
                Tactics by piece</Link
            >
            gives you short puzzles that win material in two moves, grouped by
            the piece that does it, so you learn what each piece can do.
        </p>
        <p>
            <Link :href="ShowSquaresController.url()">Square control</Link>
            walks through a beginner's game. After every move you mark the
            squares the piece gave up and the squares it now controls, to train
            your eye for the whole board.
        </p>
        <p>
            <Link :href="ShowHangingController.url()">
                Spot the hanging piece</Link
            >
            uses the same games. After every move you mark each piece left
            undefended and under attack, on either side, so you stop missing
            free captures and stop giving them away.
        </p>

        <h2>Your progress</h2>
        <p>
            Your scores and settings stay in this browser. Nothing is sent to
            us, and there is no account. Clearing the browser's data or changing
            device starts you afresh. The
            <Link :href="ShowPrivacyController.url()">privacy page</Link>
            says more.
        </p>

        <h2>Open source</h2>
        <p>
            The site is free and open source, under the GPL-3.0 licence. The
            <a :href="SOURCE_CODE_URL">source code</a> is on GitHub.
        </p>
    </TextPage>
</template>
