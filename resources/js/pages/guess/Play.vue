<script setup lang="ts">
// Guess the move: play through one master game. The page arrives with the
// game's details, fetches its moves from the data endpoint and reads the
// user's saved progress, so a game started earlier resumes.

import { Head, Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ShowMasterGameController from '@/actions/App/Http/Controllers/Api/ShowMasterGameController';
import ListMasterGamesController from '@/actions/App/Http/Controllers/Guess/ListMasterGamesController';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import GuessGame from '@/components/guess/GuessGame.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { MasterGameData, MasterGameDetailsData } from '@/generated/data';
import { gameListLeft } from '@/guess/listReturn';
import { storageAvailable } from '@/storage/db';
import { readMasterGame } from '@/storage/masterGames';
import type { MasterGameRecord } from '@/storage/types';

const props = defineProps<{
    game: MasterGameDetailsData;
}>();

const loaded = ref<MasterGameData | null>(null);

/** What the browser holds for this game, read before the game starts. */
const saved = ref<MasterGameRecord | null>(null);
const canSave = ref(true);

/**
 * Why the moves did not load: the game is not there, or the request itself
 * failed, which a retry may fix.
 */
const failure = ref<'missing' | 'unreachable' | null>(null);

// The board is kept short enough for the whole screen to fit without
// scrolling: the header, the prompt and the bottom bar all stay in view.
const page = ref<HTMLElement | null>(null);
const boardHeightLimit = useBoardHeightLimit(page);

// The back arrow returns to the game list as the user left it, with its
// page, search and filters. A game opened directly goes to the master's list.
const backUrl =
    gameListLeft(props.game.master.slug) ??
    ListMasterGamesController.url(props.game.master.slug);

// White's name first. The master goes by family name, as in the mockups.
const players = computed(() => {
    const master = props.game.master.name.split(' ').at(-1) ?? '';
    const opponent = props.game.opponent_name;

    return props.game.master_color === 'white'
        ? `${master} vs. ${opponent}`
        : `${opponent} vs. ${master}`;
});

const occasion = computed(() =>
    [props.game.event, props.game.year]
        .filter((part) => part !== null)
        .join(', '),
);

async function load(): Promise<void> {
    failure.value = null;

    try {
        const response = await fetch(
            ShowMasterGameController.url(props.game.id),
            {
                headers: { Accept: 'application/json' },
            },
        );

        if (response.status === 404) {
            failure.value = 'missing';

            return;
        }

        if (!response.ok) {
            throw new Error(
                `The game did not load: ${String(response.status)}`,
            );
        }

        const body: unknown = await response.json();

        // Neither of these fails: without storage the game starts afresh.
        canSave.value = await storageAvailable();
        saved.value = await readMasterGame(props.game.id);
        loaded.value = body as MasterGameData;
    } catch {
        failure.value = 'unreachable';
    }
}

onMounted(load);
</script>

<template>
    <Head
        :title="`Guess the move: ${players}${occasion ? `, ${occasion.replace(', ', ' ')}` : ''}`"
    />

    <main
        ref="page"
        class="sm:mx-auto sm:w-[560px]"
        :style="{ '--board-height-limit': boardHeightLimit ?? undefined }"
    >
        <header class="flex items-center gap-1 p-1">
            <Link
                :href="backUrl"
                class="flex size-11 flex-none items-center justify-center"
                aria-label="Back to the games"
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
                <p class="font-serif text-title-small">{{ players }}</p>
                <p v-if="occasion" class="text-label text-muted">
                    {{ occasion }}
                </p>
            </div>
            <!-- Keeps the title centred; the game options will go here. -->
            <span class="size-11 flex-none" aria-hidden="true" />
        </header>

        <GuessGame
            v-if="loaded"
            :game="loaded"
            :saved="saved"
            :can-save="canSave"
        />

        <div
            v-else-if="failure === 'missing'"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                This game is no longer here.
            </h1>
            <p class="text-muted">
                Its moves could not be found. Go back and choose another game.
            </p>
        </div>

        <div
            v-else-if="failure === 'unreachable'"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                The game did not load.
            </h1>
            <p class="text-muted">Check your connection, then try again.</p>
            <AppButton @click="load">Try again</AppButton>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the game…
        </p>
    </main>
</template>
