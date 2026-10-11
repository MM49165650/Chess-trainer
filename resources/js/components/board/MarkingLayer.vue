<script setup lang="ts">
import { computed } from 'vue';
import type { Color, Phase, Square } from '@/chess/conventions';
import type { MarkFeedback } from './types';

const props = defineProps<{
    orientation: Color;
    /** The phase being marked. Null shows the marks without taking taps. */
    phase: Phase | null;
    /** When set, the feedback is drawn in place of the marks. */
    feedback: MarkFeedback | null;
}>();

const marks = defineModel<Square[]>('marks', { required: true });

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

// Row by row from the top left corner, as the board is drawn.
const squares = computed<Square[]>(() => {
    const white = props.orientation === 'white';
    const files = white ? FILES : FILES.toReversed();
    const ranks = white ? RANKS.toReversed() : RANKS;

    return ranks.flatMap((rank) =>
        files.map((file): Square => `${file}${rank}`),
    );
});

const canMark = computed(() => props.phase !== null && props.feedback === null);

type State = 'marked' | 'correct' | 'missed' | 'wrong' | 'empty';

function stateOf(square: Square): State {
    if (props.feedback === null) {
        return marks.value.includes(square) ? 'marked' : 'empty';
    }

    if (props.feedback.correct.includes(square)) {
        return 'correct';
    }

    if (props.feedback.missed.includes(square)) {
        return 'missed';
    }

    return props.feedback.wrong.includes(square) ? 'wrong' : 'empty';
}

function toggle(square: Square): void {
    marks.value = marks.value.includes(square)
        ? marks.value.filter((marked) => marked !== square)
        : [...marks.value, square];
}
</script>

<template>
    <div class="marking-layer" :class="phase ?? 'controlled'">
        <button
            v-for="square in squares"
            :key="square"
            type="button"
            class="mark-square"
            :class="stateOf(square)"
            :disabled="!canMark"
            :aria-label="`${square}, ${stateOf(square)}`"
            :aria-pressed="canMark ? stateOf(square) === 'marked' : undefined"
            @click="toggle(square)"
        />
    </div>
</template>

<style scoped>
.marking-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
}

.marking-layer.lost {
    --mark-fill: var(--color-mark-lost);
    --mark-border: var(--color-mark-lost-border);
}

.marking-layer.controlled {
    --mark-fill: var(--color-mark-controlled);
    --mark-border: var(--color-mark-controlled-border);
}

.marking-layer.hanging {
    --mark-fill: var(--color-mark-hanging);
    --mark-border: var(--color-mark-hanging-border);
}

.mark-square {
    box-sizing: border-box;
    border: 3px solid transparent;
    touch-action: manipulation;
}

.mark-square.marked {
    border-color: var(--mark-border);
    background-color: color-mix(in srgb, var(--mark-fill) 50%, transparent);
}

/* The three kinds of feedback differ in shape as well as colour. */
.mark-square.correct {
    border-color: var(--color-feedback-correct-border);
    background-color: color-mix(
        in srgb,
        var(--color-feedback-correct) 50%,
        transparent
    );
}

.mark-square.missed {
    border-style: dashed;
    border-color: var(--color-feedback-correct-border);
}

.mark-square.wrong {
    border-color: var(--color-feedback-wrong-border);
    background-color: color-mix(
        in srgb,
        var(--color-feedback-wrong) 55%,
        transparent
    );
}
</style>
