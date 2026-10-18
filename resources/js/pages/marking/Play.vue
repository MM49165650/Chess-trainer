<script setup lang="ts">
// The play page of the two marking modes, square control and spot the
// hanging piece: watch a beginner game one move at a time and mark what the
// mode asks about. The page resumes the mode's session where it stopped, or
// picks a game at random from those the mode has not seen, of the length the
// mode is set to, and fetches it. At a game's own address it opens that game
// instead, by its number. Each mode keeps its own session and seen games.

import { router } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ShowPracticeGameController from '@/actions/App/Http/Controllers/Api/ShowPracticeGameController';
import PlayHangingController from '@/actions/App/Http/Controllers/Hanging/PlayHangingController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import PlaySquaresController from '@/actions/App/Http/Controllers/Squares/PlaySquaresController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import BackArrow from '@/components/BackArrow.vue';
import { useBoardHeightLimit } from '@/components/board/useBoardHeightLimit';
import PageHead from '@/components/PageHead.vue';
import ReportProblem from '@/components/ReportProblem.vue';
import MarkingGame from '@/components/marking/MarkingGame.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { PageMetaData, PracticeGamePlayData } from '@/generated/data';
import type { GameListItem } from '@/marking/choose';
import type { MarkingMode } from '@/marking/phases';
import {
    forgetGame,
    openGame,
    pickGame,
    practiceGames,
} from '@/marking/picking';
import { emptyScores, withPhase, type RunningScore } from '@/marking/tallies';
import {
    startOf,
    type GameStart,
    type PhaseResult,
    type ResumePoint,
} from '@/marking/useMarkingGame';
import type { ProblemReport } from '@/report';
import { storageAvailable } from '@/storage/db';
import {
    deleteSession,
    readScores,
    readSession,
    recordGameSeen,
    recordPhase,
} from '@/storage/marking';

const props = defineProps<{
    /** Which of the two modes the page is in. */
    mode: MarkingMode;
    meta: PageMetaData;
    /** The game to open, at its own address, by its number. */
    number?: number;
}>();

/** The mode's landing page, where the back arrow leads. */
const landing = computed(() =>
    props.mode === 'squares'
        ? ShowSquaresController.url()
        : ShowHangingController.url(),
);

/** The exercise's own address, where a random game is played. */
const playUrl = computed(() =>
    props.mode === 'squares'
        ? PlaySquaresController.url()
        : PlayHangingController.url(),
);

/** Every practice game, or null until the list arrives. */
const games = ref<readonly GameListItem[] | null>(null);

/** True when there was no game of the chosen length to pick. */
const nothingToPick = ref(false);

/** The game on the board. */
const game = ref<PracticeGamePlayData | null>(null);

/** Where the game on the board was resumed, if it was. */
const start = ref<GameStart | undefined>(undefined);

/** True once the last phase of the game on the board has ended. */
const done = ref(false);

/** The mode's running percentages, counted as each phase ends. */
const scores = ref<RunningScore[]>(emptyScores(props.mode));

/** The saves made as phases end, chained so each waits for the one before. */
let saving: Promise<unknown> = Promise.resolve();

const loading = ref(false);
const failure = ref(false);
const canSave = ref(true);

/** What there is to report as a problem: a move, while its feedback shows. */
const report = ref<ProblemReport | null>(null);

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

async function fetchList(): Promise<readonly GameListItem[]> {
    games.value = await practiceGames();

    return games.value;
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
            forgetGame(id);
            games.value = await practiceGames();

            return null;
        }

        throw error;
    }
}

/** Counts the games shown, so that each starts afresh, even a repeat. */
const round = ref(0);

function show(next: PracticeGamePlayData, at?: GameStart): void {
    round.value += 1;
    nothingToPick.value = false;
    game.value = next;
    start.value = at;
    done.value = false;
}

/**
 * Picks a game of the chosen length that the mode has not seen, other than
 * the one just played, and makes it the session, at move 1 or after the
 * skipped opening. When the mode has been through every game of that
 * length, their seen records are cleared first.
 */
async function pick(): Promise<void> {
    for (;;) {
        const session = await pickGame(
            props.mode,
            game.value === null ? [] : [game.value.id],
        );

        if (session === null) {
            game.value = null;
            nothingToPick.value = true;
            await fetchList();

            return;
        }

        const picked = await fetchGame(session.gameId);
        const at =
            picked === null ? null : startOf(picked, props.mode, session);

        if (picked !== null && at !== null) {
            show(picked, at);

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
    await fetchList();

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

/**
 * Opens a game by its number: the game in progress resumes if it is this
 * one, and otherwise this game starts at move 1 and a different game in
 * progress is left as abandoned. A saved point that is not in the game
 * starts it again at move 1.
 */
async function openNumbered(id: number): Promise<void> {
    let session = await openGame(props.mode, id);
    const opened = await fetchGame(id);

    if (opened !== null && startOf(opened, props.mode, session) === null) {
        await deleteSession(props.mode);
        session = await openGame(props.mode, id);
    }

    const at = opened === null ? null : startOf(opened, props.mode, session);

    if (opened === null || at === null) {
        await deleteSession(props.mode);
        await pick();

        return;
    }

    show(opened, at);
}

/** Loads the game to play: the one the address names, or the session's. */
async function load(): Promise<void> {
    await (props.number === undefined
        ? resumeOrPick()
        : openNumbered(props.number));
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

        // A phase that has just ended is saved before the game is left.
        await saving;

        if (current !== null && !done.value) {
            await recordGameSeen(props.mode, current.id, 'abandoned');
        }

        // At a game's own address the next game is played at the
        // exercise's address, so a reload does not open this game again.
        if (props.number !== undefined) {
            try {
                await pickGame(
                    props.mode,
                    current === null ? [] : [current.id],
                );
            } catch {
                // The play page picks a game when there is no session.
            }

            await new Promise<void>((resolve) => {
                router.visit(playUrl.value, {
                    replace: true,
                    onFinish: () => {
                        resolve();
                    },
                });
            });

            return;
        }

        await pick();
    });
}

/**
 * Counts each phase as it ends and saves where the game stands, together.
 * When the last phase of the game has ended, the game is recorded as
 * finished and the session ends. The saves are made one after another.
 */
function saveProgress(ended: PhaseResult, next: ResumePoint | null): void {
    const current = game.value;

    if (current === null) {
        return;
    }

    scores.value = withPhase(scores.value, ended.phase, ended.exact);

    if (next === null) {
        done.value = true;
    }

    saving = saving.then(() =>
        recordPhase(
            props.mode,
            current.id,
            ended,
            next === null ? null : { ...next, results: [...next.results] },
        ),
    );
}

function retry(): void {
    void run(load);
}

onMounted(async () => {
    const [available, stored] = await Promise.all([
        storageAvailable(),
        readScores(props.mode),
    ]);

    canSave.value = available;
    scores.value = stored;
    retry();
});
</script>

<template>
    <PageHead :meta="meta" />

    <main ref="page" class="sm:mx-auto sm:w-[560px]">
        <header class="flex items-center gap-1 py-1 pr-1 pl-1 short:py-0">
            <BackArrow :parent="landing" label="Back" />
            <!-- The game's number sits under the title, so that a coach can
                 read it out, without a row of its own. -->
            <div class="flex min-w-0 flex-1 flex-col">
                <p class="truncate font-serif text-title-small">
                    {{ meta.heading }}
                </p>
                <p
                    v-if="!failure && !loading && game !== null"
                    class="truncate text-label text-muted tabular-nums"
                >
                    Game {{ game.id }}
                </p>
            </div>
            <!-- Only while the game is on the board, as the report is. -->
            <ReportProblem
                :report="!failure && !loading && game !== null ? report : null"
            />
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
            :scores="scores"
            @progress="saveProgress"
            @next="nextGame"
            @report="(now) => (report = now)"
        />

        <div
            v-else-if="nothingToPick && !loading"
            class="flex flex-col items-start gap-3 px-5 pt-6"
        >
            <h1 class="font-serif text-heading tracking-heading">
                {{
                    games?.length === 0
                        ? 'There are no practice games yet.'
                        : 'There are no games of this length yet.'
                }}
            </h1>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the game…
        </p>
    </main>
</template>
