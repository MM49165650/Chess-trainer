<script setup lang="ts">
// The landing page of a marking mode, square control or spot the hanging
// piece: what the mode is, and a button that opens the exercise. It reads
// Resume while the mode has a session to go back to, and Start otherwise.
// Between the two are the mode's running percentages and its choices for
// the next game picked: the game length and the moves of the opening to
// skip. While a game is in progress, "Start a new game" leaves it as
// abandoned and starts another with the current choices.

import { Link, router } from '@inertiajs/vue3';
import { computed, onMounted, ref, watch } from 'vue';
import PlayHangingController from '@/actions/App/Http/Controllers/Hanging/PlayHangingController';
import PlaySquaresController from '@/actions/App/Http/Controllers/Squares/PlaySquaresController';
import PageHead from '@/components/PageHead.vue';
import ChoiceGroup from '@/components/settings/ChoiceGroup.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSlider from '@/components/ui/AppSlider.vue';
import type { PageMetaData } from '@/generated/data';
import { CHOICES_OF } from '@/marking/choose';
import {
    GAME_LENGTHS,
    LENGTH_RANGES,
    SKIP_MOVES_MAX,
    type GameLength,
} from '@/marking/lengths';
import type { MarkingMode } from '@/marking/phases';
import { pickGame } from '@/marking/picking';
import { emptyScores, percentage, type RunningScore } from '@/marking/tallies';
import { scoreLabel } from '@/marking/wording';
import { changeSetting, useSettings } from '@/settings/useSettings';
import { storageAvailable } from '@/storage/db';
import {
    readScores,
    readSession,
    recordGameSeen,
    type MarkingSession,
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

const skipNote = computed(() => {
    const moves = skipMoves.value;

    if (moves === 0) {
        return 'Start at move 1.';
    }

    return `Start at move ${String(moves + 1)}, after each side's first ${
        moves === 1 ? 'move' : `${String(moves)} moves`
    }.`;
});

/** The mode's session, or null when there is none or the browser has not said. */
const session = ref<MarkingSession | null>(null);

/** Whether the browser has said if the mode has a session. */
const read = ref(false);
const canSave = ref(true);

/** True while "Start a new game" picks a game. */
const starting = ref(false);

/** The mode's running percentages, or null until the browser has said. */
const scores = ref<RunningScore[] | null>(null);

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
 * Leaves the game in progress as abandoned, as "Next game" does, and picks
 * another with the current choices. The play page then resumes it. If the
 * pick fails, the play page picks one itself.
 */
async function startNewGame(): Promise<void> {
    const current = session.value;

    if (current === null || starting.value) {
        return;
    }

    starting.value = true;

    try {
        await recordGameSeen(props.mode, current.gameId, 'abandoned');
        await pickGame(props.mode, [current.gameId]);
    } catch {
        // The play page picks a game when there is no session to resume.
    }

    play();
}

onMounted(async () => {
    canSave.value = await storageAvailable();
    scores.value = await readScores(props.mode);
    session.value = await readSession(props.mode);
    read.value = true;
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
            <dl
                class="mt-4 flex w-full"
                :class="{ invisible: scores === null }"
            >
                <div
                    v-for="score in scores ?? emptyScores(mode)"
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

            <section
                aria-labelledby="landing-length"
                class="mt-4 w-full border-t border-hairline pt-4"
            >
                <h2 id="landing-length" class="text-label text-muted">
                    Game length
                </h2>
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
            </section>

            <section aria-labelledby="landing-skip" class="mt-2 w-full">
                <h2 id="landing-skip" class="text-label text-muted">
                    Skip the opening
                </h2>
                <AppSlider
                    v-model="skipMoves"
                    label="Full moves to skip"
                    unit-name="move"
                    :min="0"
                    :max="SKIP_MOVES_MAX"
                    @change="changeSkipMoves"
                />
                <p class="text-caption text-muted">{{ skipNote }}</p>
            </section>

            <p v-if="session !== null" class="text-caption text-muted">
                Your game in progress keeps going as it started. These apply to
                the next game.
            </p>

            <!-- Hidden until the browser has said which it is, so the label
                 never changes under the user's thumb. -->
            <AppButton
                size="large"
                class="mt-4"
                :class="{ invisible: !read }"
                :disabled="starting"
                @click="play"
            >
                {{ session !== null ? 'Resume' : 'Start' }}
            </AppButton>
            <AppButton
                v-if="session !== null"
                variant="quiet"
                class="-ml-2"
                :disabled="starting"
                @click="startNewGame"
            >
                Start a new game
            </AppButton>
        </div>
    </main>
</template>
