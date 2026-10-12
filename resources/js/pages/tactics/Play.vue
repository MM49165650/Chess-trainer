<script setup lang="ts">
// Tactics by piece: solve the puzzles of one piece, or of all six, easiest
// first. The page arrives with the category, fetches its lists of puzzle IDs,
// leaves out the puzzles already seen and fetches the rest a few at a time.
// Each result is saved, so no puzzle repeats until the category runs out.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ListPuzzleIdsController from '@/actions/App/Http/Controllers/Api/ListPuzzleIdsController';
import ListPuzzlesController from '@/actions/App/Http/Controllers/Api/ListPuzzlesController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import { PIECE_TYPES } from '@/chess/conventions';
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
import { storageAvailable } from '@/storage/db';
import {
    clearPuzzlesSeen,
    readPuzzlesSeen,
    recordPuzzleResult,
} from '@/storage/tactics';
import {
    seenToClear,
    servingOrder,
    type Category,
    type PuzzleEntry,
    type SeenPuzzle,
} from '@/tactics/choose';

// How many puzzles are fetched in one request. The endpoint allows 20.
const BATCH_SIZE = 10;

const props = defineProps<{
    meta: PageMetaData;
    piece: Category;
}>();

/** The category's lists of puzzle IDs, or null until they arrive. */
const lists = ref<PuzzleIdListData[] | null>(null);

/**
 * The puzzles whose result is decided, by puzzle ID. It starts from what the
 * browser has saved and is kept up here, so it holds for the visit even
 * when nothing can be saved.
 */
const seen = new Map<number, SeenPuzzle>();

/** The unseen puzzles, in the order they are served. */
const queue = ref<PuzzleEntry[]>([]);

/** How many of the queue's puzzles have been asked for so far. */
const asked = ref(0);

/** The puzzles fetched so far, in the order they are served. */
const puzzles = ref<PuzzleData[]>([]);

/** Which of them is on the board, counting from 0. */
const at = ref(0);

const loading = ref(false);
const failure = ref(false);

/** True once progress is known not to be reaching storage. */
const notSaved = ref(false);

const current = computed(() => puzzles.value[at.value] ?? null);

const puzzleCount = computed(() =>
    (lists.value ?? []).reduce((count, list) => count + list.items.length, 0),
);

/** True when every puzzle of the category has been seen. */
const ranOut = computed(
    () =>
        lists.value !== null &&
        puzzleCount.value > 0 &&
        asked.value >= queue.value.length &&
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

// Starts the category from its easiest unseen puzzle.
function buildQueue(): void {
    queue.value = servingOrder(lists.value ?? [], new Set(seen.keys()));
    asked.value = 0;
    puzzles.value = [];
    at.value = 0;
}

// Fetches until the puzzle wanted is there, or the queue has run out. An ID
// that names no puzzle is left out of a response, so one batch may not do.
async function load(): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    failure.value = false;

    try {
        if (lists.value === null) {
            // All pieces is made here from the six lists.
            const pieces = props.piece === 'all' ? PIECE_TYPES : [props.piece];

            const fetched = (await Promise.all(
                pieces.map((piece) =>
                    fetchJson(
                        ListPuzzleIdsController.url({ query: { piece } }),
                    ),
                ),
            )) as PuzzleIdListData[];

            // Neither of these fails: without storage nothing is seen yet.
            notSaved.value = !(await storageAvailable());

            for (const record of await readPuzzlesSeen()) {
                seen.set(record.puzzleId, record);
            }

            lists.value = fetched;
            buildQueue();
        }

        while (
            at.value >= puzzles.value.length &&
            asked.value < queue.value.length
        ) {
            const batch = queue.value.slice(
                asked.value,
                asked.value + BATCH_SIZE,
            );

            const fetched = (await fetchJson(
                ListPuzzlesController.url({
                    query: { ids: batch.map((entry) => entry.id).join(',') },
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

// A puzzle counts as seen once its result is decided. It is filed under its
// own piece, whichever category it was played in.
function onDecided(puzzle: PuzzleData, solved: boolean): void {
    seen.set(puzzle.id, { puzzleId: puzzle.id, piece: puzzle.piece });

    void recordPuzzleResult(puzzle.id, puzzle.piece, solved).then((done) => {
        if (!done) {
            notSaved.value = true;
        }
    });
}

function next(): void {
    at.value += 1;

    if (at.value >= puzzles.value.length) {
        void load();
    }
}

// The category has run out: its seen puzzles are forgotten, and it starts
// again from the easiest. One piece clears only its own; all pieces clears
// every piece's.
async function startAgain(): Promise<void> {
    for (const id of seenToClear(seen.values(), props.piece)) {
        seen.delete(id);
    }

    if (!(await clearPuzzlesSeen(props.piece))) {
        notSaved.value = true;
    }

    buildQueue();
    await load();
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
            <Link
                :href="ListTacticsCategoriesController.url()"
                class="flex size-11 flex-none items-center justify-center"
                aria-label="Back to the pieces"
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
            <p class="min-w-0 flex-1 text-center font-serif text-title-small">
                {{ meta.heading }}
            </p>
            <!-- Keeps the title centred. -->
            <span class="size-11 flex-none" aria-hidden="true" />
        </header>

        <p
            v-if="notSaved"
            class="px-5 pb-1 text-caption text-muted"
            role="status"
        >
            Your progress will not be saved in this browser.
        </p>

        <!-- The key starts each puzzle afresh. -->
        <TacticsPuzzle
            v-if="current"
            :key="current.id"
            :puzzle="current"
            :names-piece="piece !== 'all'"
            @decided="(solved) => current && onDecided(current, solved)"
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

        <p v-else-if="loading" class="px-5 pt-6 text-muted" role="status">
            Loading the puzzles…
        </p>

        <div
            v-else-if="ranOut"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                You have been through every
                {{ piece === 'all' ? 'puzzle' : `${piece} puzzle` }}.
            </h1>
            <p class="text-muted">They start again from the easiest.</p>
            <AppButton @click="startAgain">Continue</AppButton>
        </div>

        <div
            v-else-if="lists !== null"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                There are no
                {{ piece === 'all' ? 'puzzles' : `${piece} puzzles` }} yet.
            </h1>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the puzzles…
        </p>
    </main>
</template>
