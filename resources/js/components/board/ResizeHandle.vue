<script setup lang="ts">
// The grip at the board's corner on larger screens. It only reports how far
// it was dragged; the board turns that into a size.

import { ref } from 'vue';

const emit = defineEmits<{
    start: [];
    /** The distance dragged since the start, right and down added together. */
    drag: [change: number];
    /** One press of an arrow key. */
    step: [change: number];
}>();

const KEY_STEP = 16;

const handle = ref<HTMLElement | null>(null);

let origin: { x: number; y: number } | null = null;

function onPointerDown(event: PointerEvent): void {
    origin = { x: event.clientX, y: event.clientY };
    handle.value?.setPointerCapture(event.pointerId);
    emit('start');
}

function onPointerMove(event: PointerEvent): void {
    if (origin !== null) {
        emit('drag', event.clientX - origin.x + (event.clientY - origin.y));
    }
}

function onPointerEnd(): void {
    origin = null;
}

function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        emit('step', KEY_STEP);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        emit('step', -KEY_STEP);
    }
}
</script>

<template>
    <!-- Hidden on a phone, where the board is always the full width. -->
    <button
        ref="handle"
        type="button"
        class="resize-handle hidden sm:block"
        aria-label="Resize the board"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerEnd"
        @pointercancel="onPointerEnd"
        @keydown="onKeyDown"
    />
</template>

<style scoped>
.resize-handle {
    position: absolute;
    right: -14px;
    bottom: -14px;
    z-index: 40;
    width: 28px;
    height: 28px;
    cursor: nwse-resize;
    touch-action: none;

    /* Two diagonal lines in the corner. */
    background: linear-gradient(
        135deg,
        transparent 0 48%,
        var(--color-muted) 48% 56%,
        transparent 56% 68%,
        var(--color-muted) 68% 76%,
        transparent 76%
    );
}

.resize-handle:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
