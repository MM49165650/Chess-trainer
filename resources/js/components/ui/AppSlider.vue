<script setup lang="ts">
// A slider for a small whole number, with the chosen value shown beside it.
// It is the browser's own range input, so the mouse, touch and the arrow
// keys all work as they do everywhere else.

import { computed } from 'vue';

const props = defineProps<{
    /** What the slider sets, for screen readers. */
    label: string;
    min: number;
    max: number;
    /** Written after the number, as in "3 s". */
    unit: string;
    /** The unit in full and for one, as in "second", for screen readers. */
    unitName: string;
}>();

const value = defineModel<number>({ required: true });

/** How far along the track the value is, for the filled part. */
const filled = computed(() => {
    const share = (value.value - props.min) / (props.max - props.min);

    return `${String(share * 100)}%`;
});

/** The value as it is read out: "1 second", "3 seconds". */
const spoken = computed(() => {
    const plural = value.value === 1 ? '' : 's';

    return `${String(value.value)} ${props.unitName}${plural}`;
});
</script>

<template>
    <div class="flex items-center gap-4">
        <input
            v-model.number="value"
            type="range"
            class="app-slider"
            step="1"
            :min="min"
            :max="max"
            :aria-label="label"
            :aria-valuetext="spoken"
            :style="{ '--slider-filled': filled }"
        />
        <output
            class="w-10 flex-none text-right font-serif text-title tabular-nums"
            aria-hidden="true"
        >
            {{ value }} {{ unit }}
        </output>
    </div>
</template>

<style scoped>
.app-slider {
    --slider-track: linear-gradient(
        to right,
        var(--color-accent) var(--slider-filled),
        var(--color-control-border) var(--slider-filled)
    );

    flex: 1;
    min-width: 0;

    /* Tall enough to touch; the track drawn inside it is thin. */
    height: 44px;
    margin: 0;
    background: transparent;
    appearance: none;
    cursor: pointer;
    touch-action: pan-y;
}

.app-slider::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--slider-track);
}

.app-slider::-moz-range-track {
    height: 4px;
    border-radius: var(--radius-pill);
    background: var(--slider-track);
}

.app-slider::-webkit-slider-thumb {
    width: 24px;
    height: 24px;

    /* Centres the thumb on the track. */
    margin-top: -10px;
    border: 2px solid var(--color-surface);
    border-radius: var(--radius-pill);
    background-color: var(--color-accent);
    appearance: none;
}

.app-slider::-moz-range-thumb {
    box-sizing: border-box;
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-surface);
    border-radius: var(--radius-pill);
    background-color: var(--color-accent);
}

.app-slider:focus-visible {
    outline: none;
}

.app-slider:focus-visible::-webkit-slider-thumb {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}

.app-slider:focus-visible::-moz-range-thumb {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
