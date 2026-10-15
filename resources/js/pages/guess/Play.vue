<script setup lang="ts">
// Guess the move: play through one master game. The page arrives with the
// game's details, fetches its moves from the data endpoint and reads the
// user's saved progress, so a game started earlier resumes.

import { computed, onMounted, ref } from 'vue';
import ShowMasterGameController from '@/actions/App/Http/Controllers/Api/ShowMasterGameController';
import ListMasterGamesController from '@/actions/App/Http/Controllers/Guess/ListMasterGamesController';
import BackArrow from '@/components/BackArrow.vue';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import GuessGame from '@/components/guess/GuessGame.vue';
import PageHead from '@/components/PageHead.vue';
import ReportProblem from '@/components/ReportProblem.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type {
    MasterGameData,
    MasterGameDetailsData,
    PageMetaData,
} from '@/generated/data';
import type { ProblemReport } from '@/report';
import { storageAvailable } from '@/storage/db';
import { readMasterGame } from '@/storage/masterGames';
import type { MasterGameRecord } from '@/storage/types';

const props = defineProps<{
    /** Its heading names the two players, White first, by family name. */
    meta: PageMetaData;
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

/** What there is to report as a problem: nothing until the game is over. */
const report = ref<ProblemReport | null>(null);

// The board is kept short enough for the whole screen to fit without
// scrolling: the header, the prompt and the bottom bar all stay in view.
const page = ref<HTMLElement | null>(null);
useBoardHeightLimit(page);

// The back arrow returns to the page the user came from, such as the game
// list with its page, search and filters, or the home page. A game opened
// directly goes to the master's list.
const parentUrl = ListMasterGamesController.url(props.game.master.slug);

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
    <PageHead :meta="meta" />

    <main ref="page" class="sm:mx-auto sm:w-[560px]">
        <header class="flex items-center gap-1 p-1 short:py-0">
            <BackArrow :parent="parentUrl" label="Back" />
            <div class="flex min-w-0 flex-1 flex-col items-center text-center">
                <p class="font-serif text-title-small">{{ meta.heading }}</p>
                <p v-if="occasion" class="text-label text-muted">
                    {{ occasion }}
                </p>
            </div>
            <!-- Its room keeps the title centred while there is no flag. -->
            <ReportProblem :report="report" keep-room />
        </header>

        <GuessGame
            v-if="loaded"
            :game="loaded"
            :opponent-short-name="
                game.opponent_short_name ?? game.opponent_name
            "
            :saved="saved"
            :can-save="canSave"
            @report="(now) => (report = now)"
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
