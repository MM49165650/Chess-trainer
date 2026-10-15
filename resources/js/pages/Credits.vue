<script setup lang="ts">
// The credits page. The boards, piece sets and fonts come from the settings
// catalogue, the one list of them, so a set added there is credited here.
// Then the board code, the game and puzzle data, and the source code.

import TextPage from '@/components/TextPage.vue';
import type { PageMetaData } from '@/generated/data';
import {
    BOARD_THEMES,
    FONTS,
    PIECE_SETS,
    type Credit,
    type CreditedChoice,
} from '@/settings/catalogue';
import { SOURCE_CODE_URL } from '@/site';

defineProps<{
    meta: PageMetaData;
}>();

type CreditRow = { names: string; credit: Credit };

/** "Olive, Brown, Blue and Green". */
function listed(names: readonly string[]): string {
    return names.length < 2
        ? names.join('')
        : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
}

// Choices that share one credit, as the boards do, are named together.
function rows(choices: readonly CreditedChoice[]): CreditRow[] {
    const groups = new Map<Credit, string[]>();

    for (const choice of choices) {
        groups.set(choice.credit, [
            ...(groups.get(choice.credit) ?? []),
            choice.name,
        ]);
    }

    return [...groups].map(([credit, names]) => ({
        names: listed(names),
        credit,
    }));
}

/** Each part of the catalogue, with where its files were copied from. */
const SECTIONS = [
    { heading: 'Boards', from: 'Lichess', rows: rows(BOARD_THEMES) },
    { heading: 'Pieces', from: 'Lichess', rows: rows(PIECE_SETS) },
    { heading: 'Fonts', from: 'Fontsource', rows: rows(FONTS) },
];
</script>

<template>
    <TextPage :meta="meta">
        <p>
            The site is built from other people's generous work. Thank you to
            all of them.
        </p>

        <section v-for="section in SECTIONS" :key="section.heading">
            <h2>{{ section.heading }}</h2>
            <p v-for="row in section.rows" :key="row.names">
                <span class="font-serif text-title-small">{{ row.names }}</span
                ><br />
                <span class="text-caption text-muted">
                    By
                    <a
                        v-if="row.credit.authorUrl !== null"
                        :href="row.credit.authorUrl"
                        >{{ row.credit.author }}</a
                    ><template v-else>{{ row.credit.author }}</template
                    >, under
                    <a :href="row.credit.licenceUrl">{{ row.credit.licence }}</a
                    >. From
                    <a :href="row.credit.sourceUrl">{{ section.from }}</a
                    >.
                </span>
            </p>
        </section>

        <h2>The board</h2>
        <p>
            <span class="font-serif text-title-small">Chessground</span><br />
            <span class="text-caption text-muted">
                The board itself, by the Lichess team, under
                <a href="https://www.gnu.org/licenses/gpl-3.0.html">
                    GPL-3.0 or later</a
                >. From
                <a href="https://github.com/lichess-org/chessground">GitHub</a>.
            </span>
        </p>

        <h2>Games and puzzles</h2>
        <p>
            <span class="font-serif text-title-small">PGN Mentor</span><br />
            <span class="text-caption text-muted">
                The master games in guess the move, from the free game files at
                <a href="https://www.pgnmentor.com/">pgnmentor.com</a>. Only the
                moves and the basic details of each game are used.
            </span>
        </p>
        <p>
            <span class="font-serif text-title-small">Lichess</span><br />
            <span class="text-caption text-muted">
                The puzzles in tactics by piece, and the beginner games in
                square control and spot the hanging piece, from the
                <a href="https://database.lichess.org/">Lichess open database</a
                >, released under
                <a href="https://creativecommons.org/publicdomain/zero/1.0/"
                    >CC0</a
                >. The players' names are not kept.
            </span>
        </p>

        <h2>Source code</h2>
        <p>
            This site is free and open source, under GPL-3.0. Read or copy the
            <a :href="SOURCE_CODE_URL">source code on GitHub</a>.
        </p>
    </TextPage>
</template>
