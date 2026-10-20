<script setup lang="ts">
// The Continue card: a way back into the master game played most recently,
// when one is in progress. Nothing is shown when none is. It says so once
// the browser has been read, so the page can wait for it before showing
// what comes below, and nothing moves as the page opens.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ShowMasterGameController from '@/actions/App/Http/Controllers/Api/ShowMasterGameController';
import PlayMasterGameController from '@/actions/App/Http/Controllers/Guess/PlayMasterGameController';
import AppButton from '@/components/ui/AppButton.vue';
import type { MasterGameData } from '@/generated/data';
import { readAllMasterGames } from '@/storage/masterGames';
import type { MasterGameRecord } from '@/storage/types';

const emit = defineEmits<{
    read: [];
}>();

/** The master game in progress that was played most recently, if any. */
const inProgress = ref<MasterGameRecord | null>(null);

/** That game, once it has been fetched. */
const game = ref<MasterGameData | null>(null);
const failure = ref(false);

/**
 * "Capablanca vs. Marshall, 1918": White first, by family name, as in the
 * play screen's header. An opponent without one goes by the full name.
 */
const gameName = computed(() => {
    if (game.value === null) {
        return '';
    }

    const master =
        game.value.master.name.split(' ').at(-1) ?? game.value.master.name;
    const opponent = game.value.opponent_short_name ?? game.value.opponent_name;
    const players =
        game.value.master_color === 'white'
            ? `${master} vs. ${opponent}`
            : `${opponent} vs. ${master}`;

    return game.value.year === null
        ? players
        : `${players}, ${String(game.value.year)}`;
});

/** "Move 9 of 36": the guess the game resumes at. */
const moveNote = computed(() => {
    if (game.value === null || inProgress.value === null) {
        return '';
    }

    const guessed = inProgress.value.current?.guesses.length ?? 0;
    const next = Math.min(guessed + 1, game.value.guess_count);

    return `Move ${String(next)} of ${String(game.value.guess_count)}`;
});

const continueUrl = computed(() =>
    inProgress.value === null
        ? ''
        : PlayMasterGameController.url({
              master: inProgress.value.masterSlug,
              game: inProgress.value.gameId,
          }),
);

async function loadGame(): Promise<void> {
    const record = inProgress.value;

    if (record === null) {
        return;
    }

    failure.value = false;

    try {
        const response = await fetch(
            ShowMasterGameController.url(record.gameId),
            {
                headers: { Accept: 'application/json' },
            },
        );

        // A game that is no longer there has nothing to continue.
        if (response.status === 404) {
            inProgress.value = null;

            return;
        }

        if (!response.ok) {
            throw new Error(
                `The game did not load: ${String(response.status)}`,
            );
        }

        game.value = (await response.json()) as MasterGameData;
    } catch {
        failure.value = true;
    }
}

onMounted(async () => {
    let latest: MasterGameRecord | null = null;

    try {
        const records = await readAllMasterGames();

        for (const record of records) {
            const at = record.current?.updatedAt;

            if (at !== undefined && at > (latest?.current?.updatedAt ?? '')) {
                latest = record;
            }
        }
    } finally {
        inProgress.value = latest;
        emit('read');
    }

    await loadGame();
});
</script>

<template>
    <!-- The master game in progress: loading, failed, or ready. -->
    <section v-if="inProgress !== null" aria-label="Continue">
        <Link
            v-if="game !== null"
            :href="continueUrl"
            class="flex items-center justify-between gap-3 px-5 py-3.5"
        >
            <span class="flex min-w-0 flex-col gap-0.5">
                <span class="label-caps text-accent">Continue</span>
                <span class="font-serif text-title">
                    {{ gameName }}
                </span>
                <span class="text-caption text-muted tabular-nums">
                    {{ moveNote }}
                </span>
            </span>
            <svg
                aria-hidden="true"
                class="flex-none"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
        </Link>

        <div
            v-else-if="failure"
            class="flex flex-col items-start gap-2 px-5 py-3.5"
            role="alert"
        >
            <span class="label-caps text-accent">Continue</span>
            <p class="font-serif text-title">Your game did not load.</p>
            <p class="text-caption text-muted">
                Check your connection, then try again.
            </p>
            <AppButton variant="outline" @click="loadGame">
                Try again
            </AppButton>
        </div>

        <div v-else class="flex flex-col gap-0.5 px-5 py-3.5">
            <span class="label-caps text-accent">Continue</span>
            <p class="text-caption text-muted" role="status">
                Loading your game…
            </p>
        </div>
    </section>
</template>
