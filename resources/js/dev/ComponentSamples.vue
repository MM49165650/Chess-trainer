<script setup lang="ts">
// A development-only page that shows every design token and shared component,
// for comparing with the mockups in both modes. It is not part of the site.

import { Head } from '@inertiajs/vue3';
import { onBeforeUnmount, ref, watch } from 'vue';
import type { MoveParts, Square } from '@/chess/conventions';
import ChessBoard from '@/components/board/ChessBoard.vue';
import type { MarkFeedback } from '@/components/board/types';
import AppButton from '@/components/ui/AppButton.vue';
import BottomBar from '@/components/ui/BottomBar.vue';
import ListRow from '@/components/ui/ListRow.vue';
import SlideUpPanel from '@/components/ui/SlideUpPanel.vue';

type Appearance = 'system' | 'light' | 'dark';

const APPEARANCES: readonly { value: Appearance; label: string }[] = [
    { value: 'system', label: 'Device' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const COLOURS: readonly { name: string; token: string }[] = [
    { name: 'Page background', token: '--color-page' },
    { name: 'Raised surface', token: '--color-surface' },
    { name: 'Text', token: '--color-ink' },
    { name: 'Muted text', token: '--color-muted' },
    { name: 'Hairline', token: '--color-hairline' },
    { name: 'Outline button border', token: '--color-control-border' },
    { name: 'Accent', token: '--color-accent' },
    { name: 'Wrong guess', token: '--color-wrong' },
    { name: 'On the page: lost', token: '--color-mark-lost' },
    { name: 'On the page: controls', token: '--color-mark-controlled' },
    { name: 'On the page: hanging', token: '--color-mark-hanging' },
    { name: 'On the page: correct', token: '--color-feedback-correct' },
    { name: 'On the page: wrong', token: '--color-feedback-wrong' },
    { name: 'On the board: lost', token: '--color-board-mark-lost' },
    {
        name: 'On the board: controls',
        token: '--color-board-mark-controlled',
    },
    { name: 'On the board: hanging', token: '--color-board-mark-hanging' },
    {
        name: 'On the board: correct',
        token: '--color-board-feedback-correct',
    },
    { name: 'On the board: wrong', token: '--color-board-feedback-wrong' },
    {
        name: 'On the board: last move, light',
        token: '--color-board-last-move-light',
    },
    {
        name: 'On the board: last move, dark',
        token: '--color-board-last-move-dark',
    },
];

// The position after 1. e4 e5 2. Nf3, as in the square-control mockups.
const AFTER_NF3 =
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
const NF3: MoveParts = { from: 'g1', to: 'f3', promotion: null };

// Black is in check from the bishop on b5.
const CHECK = 'rnbqkbnr/ppp2ppp/8/1B1pp3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 3';

const FEEDBACK: MarkFeedback = {
    correct: ['d4', 'e5', 'g5', 'h4', 'g1'],
    missed: ['d2', 'e1', 'h2'],
    wrong: ['d3'],
};

const appearance = ref<Appearance>('system');
const panelOpen = ref(false);
const toggled = ref(true);

const lostMarks = ref<Square[]>(['e2', 'f3', 'h3']);
const controlledMarks = ref<Square[]>(['d4', 'e5', 'g5', 'h4', 'g1', 'd2']);
const hangingMarks = ref<Square[]>(['e5', 'e4']);

// Stands in for the appearance setting, which arrives with the settings page.
watch(appearance, (chosen) => {
    if (chosen === 'system') {
        delete document.documentElement.dataset.appearance;
    } else {
        document.documentElement.dataset.appearance = chosen;
    }
});

onBeforeUnmount(() => {
    delete document.documentElement.dataset.appearance;
});
</script>

<template>
    <Head title="Components" />

    <main class="sm:mx-auto sm:w-[560px]">
        <header class="flex flex-col gap-2 px-5 pt-5">
            <p class="label-caps text-muted">Design tokens and components</p>
            <h1 class="font-serif text-display tracking-heading">
                Every piece of the Study look, on one page.
            </h1>
            <div class="flex flex-wrap items-center gap-2 pt-2">
                <AppButton
                    v-for="option in APPEARANCES"
                    :key="option.value"
                    variant="outline"
                    :aria-pressed="appearance === option.value"
                    @click="appearance = option.value"
                >
                    {{ option.label }}
                </AppButton>
            </div>
        </header>

        <section class="flex flex-col gap-2 px-5 pt-8">
            <h2 class="label-caps text-muted">Type</h2>
            <p class="label-caps text-accent">Label, uppercase</p>
            <p class="font-serif text-display tracking-heading">Display, 34</p>
            <p class="font-serif text-heading tracking-heading">
                Heading, 26: What did Capablanca play?
            </p>
            <p class="font-serif text-title">Title, 22: Guess the move</p>
            <p class="font-serif text-title-small">
                Small title, 18: Capablanca vs. Marshall
            </p>
            <p class="font-serif text-title-small italic">
                Small title, italic: [Site name]
            </p>
            <p class="text-button font-semibold">Button text, 16</p>
            <p>
                Body, 14: Move a piece to make your guess. You get one attempt.
                José Raúl Capablanca.
            </p>
            <p class="text-caption text-muted">
                Caption, 13, muted: Move 9 of 36
            </p>
            <p class="flex items-baseline gap-2">
                <span class="font-serif text-heading tabular-nums"
                    >23 / 36</span
                >
                <span class="text-caption text-muted">correct so far</span>
            </p>
        </section>

        <section class="px-5 pt-8">
            <h2 class="label-caps text-muted">Colours</h2>
            <ul class="grid grid-cols-2 gap-x-5 pt-2">
                <li
                    v-for="colour in COLOURS"
                    :key="colour.token"
                    class="flex items-center gap-3 border-b border-hairline py-2"
                >
                    <span
                        class="size-8 flex-none border border-hairline"
                        :style="{ backgroundColor: `var(${colour.token})` }"
                    />
                    <span class="text-caption">{{ colour.name }}</span>
                </li>
            </ul>
        </section>

        <section class="px-5 pt-8">
            <h2 class="label-caps text-muted">Buttons</h2>
            <div class="flex flex-wrap items-center gap-3 pt-3">
                <AppButton size="large">Submit · 6 marked</AppButton>
                <AppButton>Primary</AppButton>
                <AppButton disabled>Disabled</AppButton>
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-3">
                <AppButton variant="outline">Reply delay 3 s</AppButton>
                <AppButton
                    variant="outline"
                    :aria-pressed="toggled"
                    @click="toggled = !toggled"
                >
                    Switched {{ toggled ? 'on' : 'off' }}
                </AppButton>
                <AppButton variant="outline" disabled>Disabled</AppButton>
                <AppButton variant="quiet">Next game</AppButton>
                <AppButton
                    variant="outline"
                    size="large"
                    icon
                    aria-label="Rewind"
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
                        <path d="M9 7l-5 5 5 5M4 12h16" />
                    </svg>
                </AppButton>
            </div>
        </section>

        <section class="px-5 pt-8">
            <h2 class="label-caps text-muted">List rows</h2>
            <ListRow
                title="Guess the move"
                description="Play through a master's win and guess each move."
                href="/dev/components"
            >
                <template #leading>01</template>
            </ListRow>
            <ListRow
                title="Square control"
                description="After every move, mark what changed on the board."
                href="/dev/components"
            >
                <template #leading>02</template>
            </ListRow>
            <ListRow
                title="Frank Marshall"
                description="New York, 1918 · 36 moves"
                href="/dev/components"
            >
                <template #trailing>23 / 36</template>
            </ListRow>
            <ListRow
                title="Savielly Tartakower"
                description="London, 1922 · 52 moves"
                href="/dev/components"
            >
                <template #trailing>
                    <span class="label-caps text-accent">In progress</span>
                </template>
            </ListRow>
            <ListRow title="A row that is not a link" />
        </section>

        <section class="px-5 pt-8">
            <h2 class="label-caps text-muted">Slide-up panel</h2>
            <div class="pt-3">
                <AppButton variant="outline" @click="panelOpen = true">
                    Filters
                </AppButton>
            </div>
            <SlideUpPanel v-model:open="panelOpen" title="Filters">
                <p class="pt-3 label-caps text-muted">Capablanca played</p>
                <div class="flex flex-wrap gap-2 pt-2">
                    <AppButton variant="outline" aria-pressed="true">
                        Either colour
                    </AppButton>
                    <AppButton variant="outline">White</AppButton>
                    <AppButton variant="outline">Black</AppButton>
                </div>
                <p class="pt-4 text-muted">
                    The panel closes on its close button, on Escape, and on a
                    tap outside it.
                </p>
                <div class="flex pt-5">
                    <AppButton size="large" stretch @click="panelOpen = false">
                        Show 214 games
                    </AppButton>
                </div>
            </SlideUpPanel>
        </section>

        <section class="pt-8">
            <h2 class="px-5 label-caps text-muted">Board: last move</h2>
            <p class="px-5 pb-3">Nf3, from a dark square to a light one.</p>
            <ChessBoard :fen="AFTER_NF3" :last-move="NF3" />
        </section>

        <section class="pt-8">
            <h2 class="px-5 label-caps text-muted">Board: marking, lost</h2>
            <p class="px-5 pb-3">Tap a square to mark it or clear it.</p>
            <ChessBoard
                v-model:marks="lostMarks"
                :fen="AFTER_NF3"
                :show-last-move="false"
                mark-phase="lost"
            />
        </section>

        <section class="pt-8">
            <h2 class="px-5 pb-3 label-caps text-muted">
                Board: marking, controls
            </h2>
            <ChessBoard
                v-model:marks="controlledMarks"
                :fen="AFTER_NF3"
                :show-last-move="false"
                mark-phase="controlled"
            />
        </section>

        <section class="pt-8">
            <h2 class="px-5 pb-3 label-caps text-muted">
                Board: marking, hanging
            </h2>
            <ChessBoard
                v-model:marks="hangingMarks"
                :fen="AFTER_NF3"
                :show-last-move="false"
                mark-phase="hanging"
            />
        </section>

        <section class="pt-8">
            <h2 class="px-5 label-caps text-muted">Board: feedback</h2>
            <p class="px-5 pb-3">
                Five correct, three missed (dashed), one wrong (red).
            </p>
            <ChessBoard
                :fen="AFTER_NF3"
                :show-last-move="false"
                :feedback="FEEDBACK"
            />
        </section>

        <section class="pt-8 pb-8">
            <h2 class="px-5 pb-3 label-caps text-muted">Board: check</h2>
            <ChessBoard :fen="CHECK" />
        </section>

        <BottomBar>
            <AppButton
                variant="outline"
                size="large"
                icon
                aria-label="Rewind to the position before the move"
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
                    <path d="M9 7l-5 5 5 5M4 12h16" />
                </svg>
            </AppButton>
            <AppButton size="large" stretch>Submit · 6 marked</AppButton>
        </BottomBar>
    </main>
</template>
