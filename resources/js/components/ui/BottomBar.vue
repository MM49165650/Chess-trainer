<script setup lang="ts">
// The bar fixed to the bottom of the screen that holds a screen's main
// action, within thumb reach. It keeps a space of its own height in the page,
// so the end of the page is never hidden behind it.

import { onBeforeUnmount, onMounted, ref } from 'vue';

const bar = ref<HTMLElement | null>(null);
const height = ref(0);

let observer: ResizeObserver | null = null;

onMounted(() => {
    if (bar.value === null) {
        return;
    }

    const element = bar.value;

    observer = new ResizeObserver(() => {
        height.value = element.offsetHeight;
    });
    observer.observe(element);
});

onBeforeUnmount(() => {
    observer?.disconnect();
});
</script>

<template>
    <div :style="{ height: `${String(height)}px` }" aria-hidden="true" />

    <div ref="bar" class="bottom-bar">
        <div class="bottom-bar-content">
            <slot />
        </div>
    </div>
</template>

<style scoped>
.bottom-bar {
    position: fixed;
    inset: auto 0 0;
    z-index: 50;
    border-top: 1px solid var(--color-hairline);
    background-color: var(--color-page);

    /* Clear of the home indicator on a phone without a home button. */
    padding-bottom: env(safe-area-inset-bottom);
}

.bottom-bar-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px 16px;
}

/* Less room on a short phone screen, so the board has more. */
@media (max-width: 639px) and (max-height: 800px) {
    .bottom-bar-content {
        padding: 6px 20px 8px;
    }
}

/* On larger screens the content lines up with the page's column. */
@media (min-width: 640px) {
    .bottom-bar-content {
        width: 560px;
        margin-inline: auto;
    }
}
</style>
