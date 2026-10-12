<script setup lang="ts">
// Tactics by piece: solve the puzzles of one piece, easiest first. The page
// arrives with the piece, fetches the category's list of puzzle IDs and then
// the puzzles themselves, a few at a time. Nothing is saved yet, so every
// visit starts from the first puzzle.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ListPuzzleIdsController from '@/actions/App/Http/Controllers/Api/ListPuzzleIdsController';
import ListPuzzlesController from '@/actions/App/Http/Controllers/Api/ListPuzzlesController';
import type { PieceType } from '@/chess/conventions';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import PageHead from '@/components/PageHead.vue';
import TacticsPuzzle from '@/components/tactics/TacticsPuzzle.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type {
    PageMetaData,
    PuzzleData,
    PuzzleIdListData,
    PuzzleListData,
} from '@/generated/data';

// How many puzzles are fetched in one request. The endpoint allows 20.
const BATCH_SIZE = 10;

const props = defineProps<{
    meta: PageMetaData;
    piece: PieceType;
}>();

/** The category's puzzle IDs, easiest first, or null until they arrive. */
const ids = ref<number[] | null>(null);

/** How many of those IDs have been asked for so far. */
const asked = ref(0);

/** The puzzles fetched so far, in the order they are served. */
const puzzles = ref<PuzzleData[]>([]);

/** Which of them is on the board, counting from 0. */
const at = ref(0);

const loading = ref(false);
const failure = ref(false);

const current = computed(() => puzzles.value[at.value] ?? null);

/** True when the category has no puzzle left to serve. */
const exhausted = computed(
    () =>
        ids.value !== null &&
        asked.value >= ids.value.length &&
        at.value >= puzzles.value.length,
);

// The board is kept short enough for the whole screen to fit without
// scrolling: the header, the prompt and the bottom bar all stay in view.
const page = ref<HTMLElement | null>(null);
const boardHeightLimit = useBoardHeightLimit(page);

async function fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`The puzzles did not load: ${String(response.status)}`);
    }

    return response.json();
}

// Fetches until the puzzle wanted is there, or the list has run out. An ID
// that names no puzzle is left out of a response, so one batch may not do.
async function load(): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    failure.value = false;

    try {
        if (ids.value === null) {
            const list = (await fetchJson(
                ListPuzzleIdsController.url({ query: { piece: props.piece } }),
            )) as PuzzleIdListData;

            ids.value = list.items.map(([id]) => id);
        }

        while (
            at.value >= puzzles.value.length &&
            asked.value < ids.value.length
        ) {
            const batch = ids.value.slice(
                asked.value,
                asked.value + BATCH_SIZE,
            );

            const fetched = (await fetchJson(
                ListPuzzlesController.url({
                    query: { ids: batch.join(',') },
                }),
            )) as PuzzleListData;

            puzzles.value.push(...fetched.items);
            asked.value += batch.length;
        }
    } catch {
        failure.value = true;
    } finally {
        loading.value = false;
    }
}

function next(): void {
    at.value += 1;

    if (at.value >= puzzles.value.length) {
        void load();
    }
}

function startAgain(): void {
    at.value = 0;
}

onMounted(load);
</script>

<template>
    <PageHead :meta="meta" />

    <main
        ref="page"
        class="sm:mx-auto sm:w-[560px]"
        :style="{ '--board-height-limit': boardHeightLimit ?? undefined }"
    >
        <header class="flex items-center gap-1 p-1">
            <!-- Goes to the category page once there is one. -->
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
            <div class="flex min-w-0 flex-1 flex-col items-center text-center">
                <p class="font-serif text-title-small">{{ meta.heading }}</p>
                <p v-if="current" class="text-label text-muted tabular-nums">
                    Puzzle {{ at + 1 }}
                </p>
            </div>
            <!-- Keeps the title centred. -->
            <span class="size-11 flex-none" aria-hidden="true" />
        </header>

        <!-- The key starts each puzzle afresh. -->
        <TacticsPuzzle
            v-if="current"
            :key="current.id"
            :puzzle="current"
            @next="next"
        />

        <div
            v-else-if="failure"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                The puzzles did not load.
            </h1>
            <p class="text-muted">Check your connection, then try again.</p>
            <AppButton @click="load">Try again</AppButton>
        </div>

        <div
            v-else-if="exhausted && puzzles.length > 0"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                That was the last {{ piece }} puzzle.
            </h1>
            <p class="text-muted">You have been through all of them.</p>
            <AppButton @click="startAgain">Start again</AppButton>
        </div>

        <div
            v-else-if="exhausted"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                There are no {{ piece }} puzzles yet.
            </h1>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the puzzles…
        </p>
    </main>
</template>
