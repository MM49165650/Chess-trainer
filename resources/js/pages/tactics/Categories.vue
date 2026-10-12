<script setup lang="ts">
// Tactics by piece: the all pieces option and the six pieces, in their fixed
// order. Each row opens that category's puzzles and shows the user's tally
// for it, once there is one.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import PlayTacticsController from '@/actions/App/Http/Controllers/Tactics/PlayTacticsController';
import PageHead from '@/components/PageHead.vue';
import ListRow from '@/components/ui/ListRow.vue';
import type { PageMetaData, TacticsCategoryData } from '@/generated/data';
import { storageAvailable } from '@/storage/db';
import { readTacticsTallies } from '@/storage/tactics';
import type { Tally, TacticsTallies } from '@/storage/types';
import type { Category } from '@/tactics/choose';

const props = defineProps<{
    meta: PageMetaData;
    categories: TacticsCategoryData[];
}>();

/** The user's tallies, read from the browser once the page is shown. */
const tallies = ref<TacticsTallies | null>(null);
const canSave = ref(true);

type Row = {
    category: Category;
    title: string;
    puzzleCount: number;
    tally: Tally | null;
};

const rows = computed<Row[]>(() => {
    const pieces = props.categories.map((category): Row => ({
        category: category.piece,
        title: category.piece.charAt(0).toUpperCase() + category.piece.slice(1),
        puzzleCount: category.puzzle_count,
        tally: tallies.value?.[category.piece] ?? null,
    }));

    // All pieces is the six together: a result there counts towards the
    // tally of the puzzle's own piece, so its tally is the sum.
    const all: Row = {
        category: 'all',
        title: 'All pieces',
        puzzleCount: pieces.reduce((sum, row) => sum + row.puzzleCount, 0),
        tally:
            tallies.value === null
                ? null
                : pieces.reduce<Tally>(
                      (sum, row) => ({
                          attempts: sum.attempts + (row.tally?.attempts ?? 0),
                          correct: sum.correct + (row.tally?.correct ?? 0),
                      }),
                      { attempts: 0, correct: 0 },
                  ),
    };

    return [all, ...pieces];
});

function puzzleCount(count: number): string {
    return count === 1 ? '1 puzzle' : `${count.toLocaleString('en')} puzzles`;
}

onMounted(async () => {
    canSave.value = await storageAvailable();
    tallies.value = await readTacticsTallies();
});
</script>

<template>
    <PageHead :meta="meta" />

    <main class="pb-8 sm:mx-auto sm:w-[560px]">
        <header class="flex items-center p-1">
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
        </header>

        <div class="flex flex-col gap-2 px-5 pt-2 pb-4">
            <p class="label-caps text-muted">Tactics by piece</p>
            <h1 class="font-serif text-display tracking-heading">
                Choose a piece.
            </h1>
            <p class="text-muted">
                Win material in two moves with one piece, ending in a capture.
                Easiest first.
            </p>
            <p v-if="!canSave" class="text-caption text-muted" role="status">
                Your progress will not be saved in this browser.
            </p>
        </div>

        <nav aria-label="Pieces" class="border-t border-hairline px-5">
            <ListRow
                v-for="row in rows"
                :key="row.category"
                :title="row.title"
                :description="puzzleCount(row.puzzleCount)"
                :href="PlayTacticsController.url(row.category)"
            >
                <!-- Solved out of attempted, once there is an attempt. -->
                <template
                    v-if="row.tally !== null && row.tally.attempts > 0"
                    #trailing
                >
                    <span
                        class="tabular-nums"
                        :aria-label="`${String(row.tally.correct)} solved of ${String(row.tally.attempts)} attempted`"
                    >
                        {{ row.tally.correct }} / {{ row.tally.attempts }}
                    </span>
                </template>
            </ListRow>
        </nav>
    </main>
</template>
