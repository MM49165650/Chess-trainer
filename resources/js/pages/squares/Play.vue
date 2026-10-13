<script setup lang="ts">
// Square control: watch a beginner game one move at a time and mark what
// each move changed. The page fetches the list of game IDs, picks one at
// random and fetches that game. Nothing is saved yet, so every visit starts
// a game from its first move.

import { Link } from '@inertiajs/vue3';
import { onMounted, ref } from 'vue';
import ListPracticeGameIdsController from '@/actions/App/Http/Controllers/Api/ListPracticeGameIdsController';
import ShowPracticeGameController from '@/actions/App/Http/Controllers/Api/ShowPracticeGameController';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import PageHead from '@/components/PageHead.vue';
import SquareGame from '@/components/squares/SquareGame.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type {
    PageMetaData,
    PracticeGameIdListData,
    PracticeGamePlayData,
} from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();

/** The IDs of all practice games, or null until they arrive. */
const ids = ref<number[] | null>(null);

/** The game on the board. */
const game = ref<PracticeGamePlayData | null>(null);

const loading = ref(false);
const failure = ref(false);

// The board is kept short enough for the whole screen to fit without
// scrolling: the header, the question and the bottom bar all stay in view.
const page = ref<HTMLElement | null>(null);
const boardHeightLimit = useBoardHeightLimit(page);

async function fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`The game did not load: ${String(response.status)}`);
    }

    return response.json();
}

/** A game at random, other than the one just played when there is another. */
function pick(from: readonly number[], not: number | null): number | null {
    const others = from.filter((id) => id !== not);
    const pool = others.length > 0 ? others : from;

    return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

// Fetches the ID list if it is not here yet, then a game picked from it.
async function load(): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    failure.value = false;

    try {
        if (ids.value === null) {
            const list = (await fetchJson(
                ListPracticeGameIdsController.url(),
            )) as PracticeGameIdListData;

            ids.value = list.ids;
        }

        const id = pick(ids.value, game.value?.id ?? null);

        if (id !== null) {
            game.value = (await fetchJson(
                ShowPracticeGameController.url(id),
            )) as PracticeGamePlayData;
        }
    } catch {
        failure.value = true;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    void load();
});
</script>

<template>
    <PageHead :meta="meta" />

    <main
        ref="page"
        class="sm:mx-auto sm:w-[560px]"
        :style="{ '--board-height-limit': boardHeightLimit ?? undefined }"
    >
        <header class="flex items-center gap-1 py-1 pr-3 pl-1">
            <!-- Home stands in until the landing page at /squares is built. -->
            <Link
                href="/"
                class="flex size-11 items-center justify-center"
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
            <p class="min-w-0 flex-1 font-serif text-title-small">
                {{ meta.heading }}
            </p>
        </header>

        <div
            v-if="failure"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                The game did not load.
            </h1>
            <p class="text-muted">Check your connection, then try again.</p>
            <AppButton @click="load">Try again</AppButton>
        </div>

        <!-- The key starts each game afresh. -->
        <SquareGame
            v-else-if="game !== null && !loading"
            :key="game.id"
            :game="game"
            @next="load"
        />

        <div
            v-else-if="ids !== null && ids.length === 0"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                There are no practice games yet.
            </h1>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the game…
        </p>
    </main>
</template>
