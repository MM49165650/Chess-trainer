<script setup lang="ts">
// Draws stored answers over the board for the answer viewer, which is a
// development-only page. A square in one answer looks as it does while
// marking. A square in several answers is split into stripes, always in the
// order the answers are given, and every stripe carries its letters.

import { computed } from 'vue';
import type { Color, Square } from '@/chess/conventions';
import type { AnswerSet } from './answer-set';

const props = defineProps<{
    orientation: Color;
    /** The answers to draw, in the order of their stripes. */
    sets: readonly AnswerSet[];
}>();

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

// Row by row from the top left corner, as the board is drawn.
const cells = computed(() => {
    const white = props.orientation === 'white';
    const files = white ? FILES : FILES.toReversed();
    const ranks = white ? RANKS.toReversed() : RANKS;

    return ranks.flatMap((rank) =>
        files.map((file) => {
            const square: Square = `${file}${rank}`;

            return {
                square,
                sets: props.sets.filter((set) => set.squares.includes(square)),
            };
        }),
    );
});
</script>

<template>
    <div class="answer-layer">
        <div
            v-for="cell in cells"
            :key="cell.square"
            class="answer-square"
            :data-square="cell.square"
            :data-answers="cell.sets.map((set) => set.key).join(', ')"
        >
            <div
                v-for="set in cell.sets"
                :key="set.key"
                class="stripe"
                :class="set.phase"
            >
                <span class="letter">{{ set.letters }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.answer-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
    pointer-events: none;
}

.answer-square {
    display: flex;
    min-width: 0;
}

.stripe {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    align-items: flex-start;
    justify-content: center;
    min-width: 0;
    border-block: 3px solid var(--mark-border);
    background-color: color-mix(in srgb, var(--mark-fill) 50%, transparent);
}

/* The outer stripes close the border around the square. */
.stripe:first-child {
    border-inline-start: 3px solid var(--mark-border);
}

.stripe:last-child {
    border-inline-end: 3px solid var(--mark-border);
}

.stripe.lost {
    --mark-fill: var(--color-board-mark-lost);
    --mark-border: var(--color-board-mark-lost-border);
}

.stripe.controlled {
    --mark-fill: var(--color-board-mark-controlled);
    --mark-border: var(--color-board-mark-controlled-border);
}

.stripe.hanging {
    --mark-fill: var(--color-board-mark-hanging);
    --mark-border: var(--color-board-mark-hanging-border);
}

.letter {
    padding: 0 2px 1px;
    background-color: var(--mark-border);
    color: var(--color-board-mark-label);
    font-family: var(--font-sans);
    font-size: 9px;
    font-weight: 700;
    line-height: 10px;
}

@media (min-width: 640px) {
    .letter {
        padding: 0 3px 1px;
        font-size: 11px;
        line-height: 13px;
    }
}
</style>
