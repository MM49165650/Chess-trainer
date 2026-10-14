<script setup lang="ts">
// The play page of the two marking modes, square control and spot the
// hanging piece: watch a beginner game one move at a time and mark what the
// mode asks about. The page resumes the mode's session where it stopped, or
// picks a game at random from those the mode has not seen, and fetches it.
// Each mode keeps its own session and seen games.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ListPracticeGameIdsController from '@/actions/App/Http/Controllers/Api/ListPracticeGameIdsController';
import ShowPracticeGameController from '@/actions/App/Http/Controllers/Api/ShowPracticeGameController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import type { Phase } from '@/chess/conventions';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import PageHead from '@/components/PageHead.vue';
import MarkingGame from '@/components/marking/MarkingGame.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type {
    PageMetaData,
    PracticeGameIdListData,
    PracticeGamePlayData,
} from '@/generated/data';
import { chooseGame } from '@/marking/choose';
import type { MarkingMode } from '@/marking/phases';
import {
    startOf,
    type GameStart,
    type ResumePoint,
} from '@/marking/useMarkingGame';
import { storageAvailable } from '@/storage/db';
import {
    clearSeenGames,
    deleteSession,
    readSeenGames,
    readSession,
    recordGameSeen,
    saveSession,
} from '@/storage/marking';

const props = defineProps<{
    /** Which of the two modes the page is in. */
    mode: MarkingMode;
    meta: PageMetaData;
}>();

/** The phase every game starts with in each mode. */
const FIRST_PHASE: Record<MarkingMode, Phase> = {
    squares: 'lost',
    hanging: 'hanging',
};

/** The mode's landing page, where the back arrow leads. */
const landing = computed(() =>
    props.mode === 'squares'
        ? ShowSquaresController.url()
        : ShowHangingController.url(),
);

/** The IDs of all practice games, or null until they arrive. */
const ids = ref<number[] | null>(null);

/** The game on the board. */
const game = ref<PracticeGamePlayData | null>(null);

/** Where the game on the board was resumed, if it was. */
const start = ref<GameStart | undefined>(undefined);

/** True once the last phase of the game on the board has ended. */
const done = ref(false);

const loading = ref(false);
const failure = ref(false);
const canSave = ref(true);

// The board is kept short enough for the whole screen to fit without
// scrolling: the header, the question and the bottom bar all stay in view.
const page = ref<HTMLElement | null>(null);
useBoardHeightLimit(page);

/** A game that does not exist, as opposed to one that failed to load. */
class GameNotFound extends Error {}

async function fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
    });

    if (response.status === 404) {
        throw new GameNotFound();
    }

    if (!response.ok) {
        throw new Error(`The game did not load: ${String(response.status)}`);
    }

    return response.json();
}

async function fetchIds(): Promise<number[]> {
    if (ids.value === null) {
        const list = (await fetchJson(
            ListPracticeGameIdsController.url(),
        )) as PracticeGameIdListData;

        ids.value = list.ids;
    }

    return ids.value;
}

/**
 * Fetches a game, or answers null when it does not exist. It is then
 * taken out of the list, so it is not picked again.
 */
async function fetchGame(id: number): Promise<PracticeGamePlayData | null> {
    try {
        return (await fetchJson(
            ShowPracticeGameController.url(id),
        )) as PracticeGamePlayData;
    } catch (error) {
        if (error instanceof GameNotFound) {
            ids.value = (ids.value ?? []).filter((other) => other !== id);

            return null;
        }

        throw error;
    }
}

/** Counts the games shown, so that each starts afresh, even a repeat. */
const round = ref(0);

function show(next: PracticeGamePlayData, at?: GameStart): void {
    round.value += 1;
    game.value = next;
    start.value = at;
    done.value = false;
}

/**
 * Picks a game the mode has not seen, other than the one just played, and
 * makes it the session at move 1. When the mode has been through every
 * game, its seen games are cleared first.
 */
async function pick(): Promise<void> {
    for (;;) {
        const list = await fetchIds();
        const seen = new Set(await readSeenGames(props.mode));
        const choice = chooseGame(
            list,
            seen,
            game.value === null ? [] : [game.value.id],
        );

        if (choice.reset) {
            await clearSeenGames(props.mode);
        }

        if (choice.id === null) {
            game.value = null;

            return;
        }

        await saveSession(props.mode, {
            gameId: choice.id,
            ply: 1,
            phase: FIRST_PHASE[props.mode],
            rook: false,
            results: [],
        });

        const picked = await fetchGame(choice.id);

        if (picked !== null) {
            show(picked);

            return;
        }

        await deleteSession(props.mode);
    }
}

/**
 * Resumes the mode's session at its saved phase. A session whose game does
 * not exist, or whose phase is not in the game, is deleted and a new game
 * picked. A game that fails to load keeps its session for Try again.
 */
async function resumeOrPick(): Promise<void> {
    await fetchIds();

    const session = await readSession(props.mode);

    if (session !== null) {
        const saved = await fetchGame(session.gameId);
        const at = saved === null ? null : startOf(saved, props.mode, session);

        if (saved !== null && at !== null) {
            show(saved, at);

            return;
        }

        await deleteSession(props.mode);
    }

    await pick();
}

async function run(task: () => Promise<void>): Promise<void> {
    if (loading.value) {
        return;
    }

    loading.value = true;
    failure.value = false;

    try {
        await task();
    } catch {
        failure.value = true;
    } finally {
        loading.value = false;
    }
}

/**
 * Moves on to another game. A game left before its end is recorded as
 * abandoned; a finished one was recorded when it ended.
 */
async function nextGame(): Promise<void> {
    await run(async () => {
        const current = game.value;

        if (current !== null && !done.value) {
            await recordGameSeen(props.mode, current.id, 'abandoned');
        }

        await pick();
    });
}

/**
 * Saves where the game stands after each phase. When the last phase of the
 * game has ended, the game is recorded as finished and the session ends.
 */
function saveProgress(next: ResumePoint | null): void {
    const current = game.value;

    if (current === null) {
        return;
    }

    if (next === null) {
        done.value = true;
        void recordGameSeen(props.mode, current.id, 'finished');

        return;
    }

    void saveSession(props.mode, {
        gameId: current.id,
        ply: next.ply,
        phase: next.phase,
        rook: next.rook,
        results: [...next.results],
    });
}

function retry(): void {
    void run(resumeOrPick);
}

onMounted(async () => {
    canSave.value = await storageAvailable();
    retry();
});
</script>

<template>
    <PageHead :meta="meta" />

    <main ref="page" class="sm:mx-auto sm:w-[560px]">
        <header class="flex items-center gap-1 py-1 pr-1 pl-1 short:py-0">
            <Link
                :href="landing"
                class="flex size-11 flex-none items-center justify-center"
                :aria-label="`Back to ${meta.heading}`"
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
            <p class="min-w-0 flex-1 truncate font-serif text-title-small">
                {{ meta.heading }}
            </p>
            <AppButton
                variant="quiet"
                :disabled="loading || game === null"
                @click="nextGame"
            >
                Next game
            </AppButton>
        </header>

        <p
            v-if="!canSave"
            class="px-5 pb-1 text-caption text-muted"
            role="status"
        >
            Your progress will not be saved in this browser.
        </p>

        <div
            v-if="failure"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                The game did not load.
            </h1>
            <p class="text-muted">Check your connection, then try again.</p>
            <AppButton @click="retry">Try again</AppButton>
        </div>

        <MarkingGame
            v-else-if="game !== null && !loading"
            :key="round"
            :mode="mode"
            :game="game"
            :start="start"
            @progress="saveProgress"
            @next="nextGame"
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
