<script setup lang="ts">
// A panel that slides up from the bottom over a dimmed page, for filters and
// options. It is a modal dialog: Escape, the close button and a tap on the
// dimmed page all close it.

import { onMounted, ref, watch } from 'vue';

defineProps<{
    title: string;
}>();

const open = defineModel<boolean>('open', { required: true });

const dialog = ref<HTMLDialogElement | null>(null);

function show(): void {
    if (dialog.value !== null && !dialog.value.open) {
        dialog.value.showModal();
    }
}

function close(): void {
    open.value = false;
}

// A tap on the dialog itself, and not on anything inside it, is a tap on the
// dimmed page around the panel.
function onDialogClick(event: MouseEvent): void {
    if (event.target === dialog.value) {
        close();
    }
}

onMounted(() => {
    if (open.value) {
        show();
    }
});

watch(open, (isOpen) => {
    if (isOpen) {
        show();
    } else {
        dialog.value?.close();
    }
});
</script>

<template>
    <dialog
        ref="dialog"
        class="slide-up-panel"
        :aria-label="title"
        @click="onDialogClick"
        @close="close"
    >
        <div class="slide-up-panel-content">
            <header class="slide-up-panel-header">
                <h2 class="slide-up-panel-title">{{ title }}</h2>
                <button
                    type="button"
                    class="slide-up-panel-close"
                    aria-label="Close"
                    @click="close"
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
                    >
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </header>
            <slot />
        </div>
    </dialog>
</template>

<style scoped>
.slide-up-panel {
    /* Along the bottom edge, and no wider than the page's column. */
    inset: auto 0 0;
    width: 100%;
    max-width: 560px;
    max-height: 85dvh;
    margin: 0 auto;
    padding: 0;
    border: 0;
    border-top: 1px solid var(--color-hairline);
    background-color: var(--color-surface);
    color: var(--color-ink);
    overflow-y: auto;
}

.slide-up-panel[open] {
    animation: slide-up 180ms ease-out;
}

.slide-up-panel::backdrop {
    background-color: var(--color-scrim);
}

.slide-up-panel-content {
    padding: 8px 20px calc(20px + env(safe-area-inset-bottom));
}

.slide-up-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: -12px;
}

.slide-up-panel-title {
    font-family: var(--font-serif);
    font-size: var(--text-title);
    line-height: var(--text-title--line-height);
}

.slide-up-panel-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-pill);
}

.slide-up-panel-close:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: -3px;
}

@keyframes slide-up {
    from {
        transform: translateY(100%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .slide-up-panel[open] {
        animation: none;
    }
}
</style>
