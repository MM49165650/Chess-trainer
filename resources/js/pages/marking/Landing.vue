<script setup lang="ts">
// The landing page of a marking mode, square control or spot the hanging
// piece: what the mode is and its percentages, since the start and in the
// last seven days against the seven before, then the game in progress, if
// there is one, with Resume, and a "New game" section with the choices for
// the next game picked: the game length and the moves of the opening to
// skip. Its button reads Start when no game is in progress, and
// "Start new game" otherwise, which leaves that game as abandoned. Last, an
// "Open a game" section opens a game by its number, at the game's address.

import { Link, router } from '@inertiajs/vue3';
import { computed, onMounted, ref, watch } from 'vue';
import PlayHangingController from '@/actions/App/Http/Controllers/Hanging/PlayHangingController';
import PlayHangingGameController from '@/actions/App/Http/Controllers/Hanging/PlayHangingGameController';
import PlaySquaresController from '@/actions/App/Http/Controllers/Squares/PlaySquaresController';
import PlaySquaresGameController from '@/actions/App/Http/Controllers/Squares/PlaySquaresGameController';
import PageHead from '@/components/PageHead.vue';
import MarkingScores from '@/components/marking/MarkingScores.vue';
import ChoiceGroup from '@/components/settings/ChoiceGroup.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSlider from '@/components/ui/AppSlider.vue';
import type { PageMetaData } from '@/generated/data';
import { gameNumber } from '@/marking/byNumber';
import { CHOICES_OF } from '@/marking/choose';
import {
    GAME_LENGTHS,
    LENGTH_RANGES,
    SKIP_MOVES_MAX,
    type GameLength,
} from '@/marking/lengths';
import type { MarkingMode } from '@/marking/phases';
import { pickGame, practiceGames } from '@/marking/picking';
import type { RunningScore } from '@/marking/tallies';
import { changeSetting, useSettings } from '@/settings/useSettings';
import { storageAvailable } from '@/storage/db';
import {
    readRecentScores,
    readScores,
    readSession,
    recordGameSeen,
    type MarkingSession,
    type RecentScore,
} from '@/storage/marking';

const props = defineProps<{
    mode: MarkingMode;
    meta: PageMetaData;
}>();

const LENGTH_NAMES: Record<GameLength, string> = {
    any: 'Any',
    short: 'Short',
    medium: 'Medium',
    long: 'Long',
};

const LENGTH_OPTIONS = GAME_LENGTHS.map((value) => ({
    value,
    label: LENGTH_NAMES[value],
}));

const settings = useSettings();
const keys = computed(() => CHOICES_OF[props.mode]);

const length = computed(() => settings[keys.value.length]);

/** The slider's value as it moves; it is saved when it is let go. */
const skipMoves = ref(settings[keys.value.skipMoves]);

watch(
    () => settings[keys.value.skipMoves],
    (saved) => {
        skipMoves.value = saved;
    },
);

/** The slider's value in words: "Off", "1 move", "5 moves". */
const skipText = computed(() => {
    const moves = skipMoves.value;

    if (moves === 0) {
        return 'Off';
    }

    return `${String(moves)} ${moves === 1 ? 'move' : 'moves'}`;
});

/** The mode's session, or null when there is none or the browser has not said. */
const session = ref<MarkingSession | null>(null);

/** The length of the session's game in plies, once the list has said. */
const sessionPlies = ref<number | null>(null);

/**
 * The game in progress by its number, and where it stands in full moves as
 * a game score counts them: "Game 1234 · Move 9 of 36", or
 * "Game 1234 · Move 9" if the game list did not load.
 */
const progressNote = computed(() => {
    if (session.value === null) {
        return '';
    }

    const move = `Game ${String(session.value.gameId)} · Move ${String(Math.ceil(session.value.ply / 2))}`;

    return sessionPlies.value === null
        ? move
        : `${move} of ${String(Math.ceil(sessionPlies.value / 2))}`;
});

/** Whether the browser has said if the mode has a session. */
const read = ref(false);
const canSave = ref(true);

/** True while "Start a new game" picks a game. */
const starting = ref(false);

/** The mode's running percentages, or null until the browser has said. */
const scores = ref<RunningScore[] | null>(null);

/** The last seven days against the seven before, per phase. */
const recent = ref<RecentScore[] | null>(null);

const playUrl = computed(() =>
    props.mode === 'squares'
        ? PlaySquaresController.url()
        : PlayHangingController.url(),
);

function play(): void {
    router.visit(playUrl.value);
}

function changeLength(chosen: GameLength): void {
    void changeSetting(keys.value.length, chosen);
}

function changeSkipMoves(): void {
    void changeSetting(keys.value.skipMoves, skipMoves.value);
}

/**
 * Starts a new game with the current choices. A game in progress is first
 * left as abandoned, as "Next game" does, and the new one picked here, never
 * the one just left; the play page then resumes it. Without a game in
 * progress, or if the pick fails, the play page picks one itself.
 */
async function startNewGame(): Promise<void> {
    const current = session.value;

    if (starting.value) {
        return;
    }

    starting.value = true;

    if (current !== null) {
        try {
            await recordGameSeen(props.mode, current.gameId, 'abandoned');
            await pickGame(props.mode, [current.gameId]);
        } catch {
            // The play page picks a game when there is no session to resume.
        }
    }

    play();
}

/** The game number as typed in "Open a game". */
const typedNumber = ref('');

/** The number last opened that names no game, shown under the field. */
const unknownNumber = ref<string | null>(null);

watch(typedNumber, () => {
    unknownNumber.value = null;
});

/**
 * Opens the game typed in "Open a game", at its own address. A number that
 * is not in the game list says so, and nothing else happens. Without the
 * list, the address says itself whether the game exists.
 */
async function openTyped(): Promise<void> {
    const typed = typedNumber.value.trim();

    if (typed === '' || starting.value) {
        return;
    }

    let id: number | null;

    try {
        id = gameNumber(await practiceGames(), typed);
    } catch {
        id = /^[0-9]{1,18}$/.test(typed) ? Number(typed) : null;
    }

    if (id === null) {
        unknownNumber.value = typed;

        return;
    }

    starting.value = true;
    router.visit(
        props.mode === 'squares'
            ? PlaySquaresGameController.url(id)
            : PlayHangingGameController.url(id),
    );
}

onMounted(async () => {
    canSave.value = await storageAvailable();
    recent.value = await readRecentScores(props.mode);
    scores.value = await readScores(props.mode);
    session.value = await readSession(props.mode);
    read.value = true;

    const gameId = session.value?.gameId;

    if (gameId !== undefined) {
        try {
            const games = await practiceGames();

            sessionPlies.value =
                games.find(([id]) => id === gameId)?.[1] ?? null;
        } catch {
            // The note then gives the move without the game's length.
        }
    }
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

        <div class="flex flex-col items-start gap-2 px-5 pt-2">
            <h1 class="font-serif text-display tracking-heading">
                {{ meta.heading }}
            </h1>
            <p class="text-muted">{{ meta.description }}</p>
            <p v-if="!canSave" class="text-caption text-muted" role="status">
                Your progress will not be saved in this browser.
            </p>
            <!-- Hidden until read, so no figure changes as the page opens. -->
            <MarkingScores
                class="mt-4 w-full"
                :class="{ invisible: scores === null }"
                :mode="mode"
                :scores="scores"
                :recent="recent"
            />

            <!-- Hidden until the browser has said whether a game is in
                 progress, so nothing moves or changes under the thumb. -->
            <div class="w-full" :class="{ invisible: !read }">
                <section
                    v-if="session !== null"
                    aria-labelledby="landing-progress"
                    class="mt-4 flex flex-col gap-3 border-y border-hairline py-4"
                >
                    <h2
                        id="landing-progress"
                        class="label-caps text-accent tabular-nums"
                    >
                        {{ progressNote }}
                    </h2>
                    <AppButton size="wide" :disabled="starting" @click="play">
                        Resume
                    </AppButton>
                </section>

                <section
                    aria-labelledby="landing-new"
                    class="flex flex-col pt-6"
                    :class="{
                        'mt-4 border-t border-hairline': session === null,
                    }"
                >
                    <h2 id="landing-new" class="label-caps text-muted">
                        New game
                    </h2>

                    <h3 id="landing-length" class="mt-4 text-label text-muted">
                        Game length
                    </h3>
                    <ChoiceGroup
                        class="mt-2"
                        label="Game length"
                        :options="LENGTH_OPTIONS"
                        :model-value="length"
                        @update:model-value="changeLength"
                    />
                    <p class="mt-2 text-caption text-muted">
                        {{ LENGTH_RANGES[length] }}
                    </p>

                    <div class="mt-4 flex items-baseline justify-between gap-3">
                        <h3 id="landing-skip" class="text-label text-muted">
                            Skip the opening
                        </h3>
                        <span
                            class="text-label text-muted tabular-nums"
                            aria-hidden="true"
                        >
                            {{ skipText }}
                        </span>
                    </div>
                    <AppSlider
                        v-model="skipMoves"
                        label="Skip the opening"
                        unit="moves"
                        unit-name="move"
                        :value-text="skipText"
                        :min="0"
                        :max="SKIP_MOVES_MAX"
                        @change="changeSkipMoves"
                    />

                    <!-- Starting a new game while one is in progress abandons
                         it, so it is then the second action, not the main. -->
                    <AppButton
                        size="wide"
                        class="mt-4"
                        :variant="session === null ? 'primary' : 'outline'"
                        :disabled="starting"
                        @click="startNewGame"
                    >
                        {{ session === null ? 'Start' : 'Start new game' }}
                    </AppButton>
                </section>

                <!-- A game by its number, as a coach gives it to a student. -->
                <section
                    aria-labelledby="landing-open"
                    class="mt-6 flex flex-col border-t border-hairline pt-6"
                >
                    <h2 id="landing-open" class="label-caps text-muted">
                        Open a game
                    </h2>
                    <form
                        class="mt-4 flex flex-col"
                        novalidate
                        @submit.prevent="openTyped"
                    >
                        <label
                            for="landing-number"
                            class="text-label text-muted"
                        >
                            Game number
                        </label>
                        <div class="mt-2 flex items-center gap-3">
                            <input
                                id="landing-number"
                                v-model="typedNumber"
                                class="field w-32 min-w-0 tabular-nums"
                                inputmode="numeric"
                                autocomplete="off"
                                maxlength="18"
                                enterkeyhint="go"
                                :aria-invalid="unknownNumber !== null"
                                aria-describedby="landing-number-note"
                            />
                            <AppButton
                                type="submit"
                                variant="outline"
                                :disabled="starting"
                            >
                                Open
                            </AppButton>
                        </div>
                        <p
                            id="landing-number-note"
                            class="mt-2 min-h-[1lh] text-caption text-wrong-text"
                            role="status"
                        >
                            <template v-if="unknownNumber !== null">
                                There is no game {{ unknownNumber }}.
                            </template>
                        </p>
                    </form>
                </section>
            </div>
        </div>
    </main>
</template>

<style scoped>
/* The size keeps a phone from zooming in when the field is tapped. */
.field {
    height: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius-pill);
    background-color: transparent;
    color: var(--color-ink);
    font-size: var(--text-button);
}

.field:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
