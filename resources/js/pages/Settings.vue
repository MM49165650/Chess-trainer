<script setup lang="ts">
// The settings page. Every choice takes effect at once and is saved in the
// browser; without storage it lasts for the visit. Reset progress sits at the
// foot, as on the progress page.

import { Link } from '@inertiajs/vue3';
import { onMounted, ref, watch } from 'vue';
import '../../css/board.css';
import PageHead from '@/components/PageHead.vue';
import ResetProgress from '@/components/ResetProgress.vue';
import ChoiceGroup from '@/components/settings/ChoiceGroup.vue';
import AppSlider from '@/components/ui/AppSlider.vue';
import type { PageMetaData } from '@/generated/data';
import {
    BOARD_THEMES,
    MARKING_PALETTES,
    PIECE_SETS,
} from '@/settings/catalogue';
import { changeSetting, useSettings } from '@/settings/useSettings';
import { storageAvailable } from '@/storage/db';
import { OPPONENT_DELAY_MAX, OPPONENT_DELAY_MIN } from '@/storage/settings';
import type { Settings } from '@/storage/types';

defineProps<{
    meta: PageMetaData;
}>();

const settings = useSettings();
const canSave = ref(true);

const APPEARANCES = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Match device' },
] as const;

const SOUNDS = [
    { value: false, label: 'Off' },
    { value: true, label: 'On' },
] as const;

const MOVE_INPUTS = [
    { value: 'tap', label: 'Tap' },
    { value: 'drag', label: 'Drag' },
    { value: 'both', label: 'Both' },
] as const;

/** The marking colours shown for each palette, in the legend's order. */
const SWATCHES = [
    { kind: 'lost', name: 'Squares lost' },
    { kind: 'controlled', name: 'Squares controlled' },
    { kind: 'hanging', name: 'Hanging' },
    { kind: 'correct', name: 'Correct' },
    { kind: 'missed', name: 'Missed' },
    { kind: 'wrong', name: 'Wrong' },
] as const;

function change<K extends keyof Settings>(key: K, value: Settings[K]): void {
    void changeSetting(key, value).then((saved) => {
        if (!saved) {
            canSave.value = false;
        }
    });
}

// The slider moves the setting as it goes and saves it when it is let go.
const delay = ref(settings.opponentDelaySeconds);

watch(
    () => settings.opponentDelaySeconds,
    (seconds) => {
        delay.value = seconds;
    },
);

onMounted(async () => {
    canSave.value = await storageAvailable();
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
        </div>

        <section aria-labelledby="settings-appearance" class="px-5 pt-6">
            <h2 id="settings-appearance" class="label-caps text-muted">
                Appearance
            </h2>
            <ChoiceGroup
                class="mt-3"
                label="Appearance"
                :options="APPEARANCES"
                :model-value="settings.appearance"
                @update:model-value="change('appearance', $event)"
            />
        </section>

        <section aria-labelledby="settings-board" class="px-5 pt-8">
            <h2 id="settings-board" class="label-caps text-muted">Board</h2>
            <div
                role="radiogroup"
                aria-labelledby="settings-board"
                class="preview-choices mt-3"
                :class="`pieces-${settings.pieceSet}`"
            >
                <label
                    v-for="theme in BOARD_THEMES"
                    :key="theme.id"
                    class="preview-choice"
                >
                    <input
                        type="radio"
                        name="board-theme"
                        class="sr-only"
                        :value="theme.id"
                        :checked="settings.boardTheme === theme.id"
                        @change="change('boardTheme', theme.id)"
                    />
                    <span
                        class="preview-board"
                        :class="`board-${theme.id}`"
                        aria-hidden="true"
                    >
                        <span class="board-image" />
                        <span class="piece-image white knight at-b" />
                        <span class="piece-image black king at-c" />
                    </span>
                    <span class="preview-name">{{ theme.name }}</span>
                </label>
            </div>
        </section>

        <section aria-labelledby="settings-pieces" class="px-5 pt-8">
            <h2 id="settings-pieces" class="label-caps text-muted">Pieces</h2>
            <div
                role="radiogroup"
                aria-labelledby="settings-pieces"
                class="preview-choices mt-3"
                :class="`board-${settings.boardTheme}`"
            >
                <label
                    v-for="set in PIECE_SETS"
                    :key="set.id"
                    class="preview-choice"
                >
                    <input
                        type="radio"
                        name="piece-set"
                        class="sr-only"
                        :value="set.id"
                        :checked="settings.pieceSet === set.id"
                        @change="change('pieceSet', set.id)"
                    />
                    <span
                        class="preview-board"
                        :class="`pieces-${set.id}`"
                        aria-hidden="true"
                    >
                        <span class="board-image" />
                        <span class="piece-image white knight at-b" />
                        <span class="piece-image black king at-c" />
                    </span>
                    <span class="preview-name">{{ set.name }}</span>
                </label>
            </div>
        </section>

        <section aria-labelledby="settings-palette" class="px-5 pt-8">
            <h2 id="settings-palette" class="label-caps text-muted">
                Marking colours
            </h2>
            <p class="mt-1 text-caption text-muted">
                For square control and spot the hanging piece.
            </p>
            <div
                role="radiogroup"
                aria-labelledby="settings-palette"
                class="mt-2 border-t border-hairline"
            >
                <label
                    v-for="palette in MARKING_PALETTES"
                    :key="palette.id"
                    class="palette-choice"
                    :data-palette="palette.id"
                >
                    <input
                        type="radio"
                        name="marking-palette"
                        class="palette-radio"
                        :value="palette.id"
                        :checked="settings.markingPalette === palette.id"
                        @change="change('markingPalette', palette.id)"
                    />
                    <span class="flex-1">{{ palette.name }}</span>
                    <span class="flex gap-1.5">
                        <span
                            v-for="swatch in SWATCHES"
                            :key="swatch.kind"
                            class="swatch"
                            :class="swatch.kind"
                            :title="swatch.name"
                        />
                    </span>
                </label>
            </div>
        </section>

        <section aria-labelledby="settings-sound" class="px-5 pt-8">
            <h2 id="settings-sound" class="label-caps text-muted">Sound</h2>
            <ChoiceGroup
                class="mt-3"
                label="Sound"
                :options="SOUNDS"
                :model-value="settings.sound"
                @update:model-value="change('sound', $event)"
            />
        </section>

        <section aria-labelledby="settings-moves" class="px-5 pt-8">
            <h2 id="settings-moves" class="label-caps text-muted">Moves</h2>
            <p class="mt-3 text-body">Make a move by</p>
            <ChoiceGroup
                class="mt-2"
                label="Make a move by"
                :options="MOVE_INPUTS"
                :model-value="settings.moveInput"
                @update:model-value="change('moveInput', $event)"
            />
            <p class="mt-5 text-body">Opponent's reply in guess the move</p>
            <div class="pt-2">
                <AppSlider
                    v-model="delay"
                    label="Opponent's reply delay"
                    unit="s"
                    unit-name="second"
                    :min="OPPONENT_DELAY_MIN"
                    :max="OPPONENT_DELAY_MAX"
                    @change="change('opponentDelaySeconds', delay)"
                />
            </div>
        </section>

        <ResetProgress class="px-5 pt-10" />
    </main>
</template>

<style scoped>
.preview-choices {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.preview-choice {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    touch-action: manipulation;
}

/* A corner of the board, four squares across, with two pieces on it. */
.preview-board {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    outline: 1px solid var(--color-hairline);
}

.preview-board .board-image {
    position: absolute;
    inset: 0;
    background-size: 200%;
}

.preview-board .piece-image {
    position: absolute;
    width: 50%;
    height: 50%;
}

.preview-board .at-b {
    bottom: 0;
    left: 0;
}

.preview-board .at-c {
    top: 0;
    right: 0;
}

.preview-choice:has(input:checked) .preview-board {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}

.preview-choice:has(input:focus-visible) .preview-board {
    outline: 3px solid var(--color-ink);
    outline-offset: 2px;
}

.preview-name {
    font-size: var(--text-caption);
    color: var(--color-muted);
}

.preview-choice:has(input:checked) .preview-name {
    color: var(--color-ink);
    font-weight: 600;
}

.palette-choice {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    border-bottom: 1px solid var(--color-hairline);
    cursor: pointer;
}

.palette-radio {
    flex: none;
    width: 20px;
    height: 20px;
    accent-color: var(--color-accent);
}

/* As in the legend: the kinds differ in shape as well as colour. */
.swatch {
    box-sizing: border-box;
    width: 18px;
    height: 18px;
    border: 3px solid var(--swatch);
    background-color: color-mix(in srgb, var(--swatch) 50%, transparent);
}

.swatch.lost {
    --swatch: var(--color-mark-lost);
}

.swatch.controlled {
    --swatch: var(--color-mark-controlled);
}

.swatch.hanging {
    --swatch: var(--color-mark-hanging);
}

.swatch.correct {
    --swatch: var(--color-feedback-correct);
}

.swatch.missed {
    --swatch: var(--color-feedback-missed);

    border-style: dashed;
    background-color: transparent;
}

.swatch.wrong {
    --swatch: var(--color-feedback-wrong);
}
</style>
