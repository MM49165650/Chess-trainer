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
            gives you short two-move puzzles, each ending in a capture, grouped
            by the piece that plays them, so you learn what each piece can do.
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
            uses the same games. After every move you mark every piece left
            hanging, on either side, so you stop missing free captures and stop
            giving them away.
        </p>

        <h2>What counts as hanging</h2>
        <p>
            A piece or pawn is hanging when the other side can win it. That
            happens in three ways.
        </p>
        <p>Nothing defends it, and something attacks it.</p>
        <p>
            It is attacked by a cheaper piece, even if it is defended. A pawn is
            worth the least, then a knight or bishop, then a rook, then the
            queen. A knight attacking a rook, for example, wins the rook for a
            knight.
        </p>
        <p>
            It is attacked twice or more and defended only once. A pawn defended
            by another pawn does not count here, unless one of the attackers is
            a pawn too.
        </p>
        <p>
            Kings are never marked. A piece pinned to its own king can only take
            along the line of the pin, but it still stops the other king from
            stepping onto any square it attacks.
        </p>
        <p>
            These rules only look at the position as it stands: who attacks and
            who defends each piece. A piece that can only be won by first making
            a threat, or through a longer combination, is not marked.
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
