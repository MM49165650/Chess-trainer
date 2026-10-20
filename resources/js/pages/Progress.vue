<script setup lang="ts">
// The progress page: the user's stats in the four modes, read from the
// browser, with the Safari note and reset progress. The modes are in the
// home page's order. The install note is left out until the iPhone test has
// found how to word it.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import { PIECE_TYPES, type PieceType } from '@/chess/conventions';
import PageHead from '@/components/PageHead.vue';
import ResetProgress from '@/components/ResetProgress.vue';
import ListRow from '@/components/ui/ListRow.vue';
import type { MasterSummaryData, PageMetaData } from '@/generated/data';
import { accuracyByMaster, type MasterAccuracy } from '@/guess/accuracy';
import type { MarkingMode } from '@/marking/phases';
import { emptyScores, percentage, type RunningScore } from '@/marking/tallies';
import { scoreLabel } from '@/marking/wording';
import { storageAvailable } from '@/storage/db';
import { readScores } from '@/storage/marking';
import { readAllMasterGames } from '@/storage/masterGames';
import { readTacticsTallies } from '@/storage/tactics';
import type { Tally, TacticsTallies } from '@/storage/types';

const props = defineProps<{
    meta: PageMetaData;
    masters: MasterSummaryData[];
}>();

type Stats = {
    accuracy: MasterAccuracy[];
    squares: RunningScore[];
    hanging: RunningScore[];
    tactics: TacticsTallies;
};

/** Everything read from the browser, or null until it has been read. */
const stats = ref<Stats | null>(null);
const canSave = ref(true);

/**
 * Safari deletes a site's saved data after seven days without a visit.
 * Other browsers on Apple devices name themselves as well as Safari.
 */
const inSafari = ref(false);

function familyName(name: string): string {
    return name.split(' ').at(-1) ?? name;
}

function plural(count: number, one: string, many: string): string {
    return `${count.toLocaleString('en')} ${count === 1 ? one : many}`;
}

function masterNote(row: MasterAccuracy): string {
    return `${plural(row.games, 'game', 'games')}, ${plural(row.moves, 'move', 'moves')}`;
}

const NAMES: Record<PieceType | 'all', string> = {
    all: 'All pieces',
    pawn: 'Pawn',
    knight: 'Knight',
    bishop: 'Bishop',
    rook: 'Rook',
    queen: 'Queen',
    king: 'King',
};

/** All pieces first, as the sum of the six, then the six in their order. */
const tacticsRows = computed(() => {
    const tallies = stats.value?.tactics;
    const pieces = PIECE_TYPES.map((piece) => ({
        key: piece,
        tally: tallies?.[piece] ?? { attempts: 0, correct: 0 },
    }));
    const all = pieces.reduce<Tally>(
        (sum, row) => ({
            attempts: sum.attempts + row.tally.attempts,
            correct: sum.correct + row.tally.correct,
        }),
        { attempts: 0, correct: 0 },
    );

    return [{ key: 'all' as const, tally: all }, ...pieces];
});

function marking(mode: MarkingMode): RunningScore[] {
    return stats.value?.[mode] ?? emptyScores(mode);
}

async function read(): Promise<void> {
    const [records, squares, hanging, tactics] = await Promise.all([
        readAllMasterGames(),
        readScores('squares'),
        readScores('hanging'),
        readTacticsTallies(),
    ]);

    stats.value = {
        accuracy: accuracyByMaster(props.masters, records),
        squares,
        hanging,
        tactics,
    };
}

onMounted(async () => {
    const agent = navigator.userAgent;

    inSafari.value =
        /Safari\//.test(agent) &&
        !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg\/|OPR|Android/.test(agent);
    canSave.value = await storageAvailable();
    await read();
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

        <div class="flex flex-col gap-2 px-5 pt-2 pb-2">
            <h1 class="font-serif text-display tracking-heading">
                {{ meta.heading }}
            </h1>
            <p v-if="!canSave" class="text-caption text-muted" role="status">
                Your progress will not be saved in this browser.
            </p>
            <p v-if="inSafari" class="text-caption text-muted">
                Safari deletes a site's saved data after seven days without a
                visit. Visiting at least once a week keeps your progress.
            </p>
        </div>

        <!-- Hidden until read, so no figure changes as the page opens. -->
        <div :class="{ invisible: stats === null }">
            <section aria-labelledby="progress-guess" class="px-5 pt-6">
                <h2 id="progress-guess" class="label-caps text-muted">
                    Guess the move
                </h2>
                <div
                    v-if="stats !== null && stats.accuracy.length > 0"
                    class="mt-2 border-t border-hairline"
                >
                    <ListRow
                        v-for="row in stats.accuracy"
                        :key="row.slug"
                        :title="familyName(row.name)"
                        :description="masterNote(row)"
                    >
                        <template #trailing>
                            <span class="font-serif text-title text-ink">
                                {{ row.percent }}%
                            </span>
                        </template>
                    </ListRow>
                </div>
                <p v-else class="mt-2 text-muted">No finished games yet.</p>
            </section>

            <section aria-labelledby="progress-hanging" class="px-5 pt-8">
                <h2 id="progress-hanging" class="label-caps text-muted">
                    Spot the hanging piece
                </h2>
                <dl class="mt-2 flex">
                    <div
                        v-for="score in marking('hanging')"
                        :key="score.phase"
                        class="flex flex-1 flex-col gap-0.5"
                    >
                        <dt class="text-label text-muted">
                            {{ scoreLabel(score.phase, true) }}
                        </dt>
                        <dd class="font-serif text-title tabular-nums">
                            {{ percentage(score.tally) }}
                        </dd>
                    </div>
                </dl>
            </section>
            <section aria-labelledby="progress-squares" class="px-5 pt-8">
                <h2 id="progress-squares" class="label-caps text-muted">
                    Square control
                </h2>
                <dl class="mt-2 flex">
                    <div
                        v-for="score in marking('squares')"
                        :key="score.phase"
                        class="flex flex-1 flex-col gap-0.5"
                    >
                        <dt class="text-label text-muted">
                            {{ scoreLabel(score.phase, true) }}
                        </dt>
                        <dd class="font-serif text-title tabular-nums">
                            {{ percentage(score.tally) }}
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="progress-tactics" class="px-5 pt-8">
                <h2 id="progress-tactics" class="label-caps text-muted">
                    Tactics by piece
                </h2>
                <div class="mt-2 border-t border-hairline">
                    <ListRow
                        v-for="row in tacticsRows"
                        :key="row.key"
                        :title="NAMES[row.key]"
                    >
                        <!-- Solved out of attempted, a dash before any. -->
                        <template #trailing>
                            <span
                                v-if="row.tally.attempts > 0"
                                :aria-label="`${String(row.tally.correct)} solved of ${String(row.tally.attempts)} attempted`"
                            >
                                {{ row.tally.correct }} /
                                {{ row.tally.attempts }}
                            </span>
                            <span v-else aria-label="No attempts">—</span>
                        </template>
                    </ListRow>
                </div>
            </section>


            <ResetProgress class="px-5 pt-10" @reset="read" />
        </div>
    </main>
</template>
