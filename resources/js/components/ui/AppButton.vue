<script setup lang="ts">
// The site's button. Primary is the filled pill for a screen's main action,
// outline is for a secondary action, quiet is plain text, and danger is an
// outline in the wrong colour for an action that cannot be undone.

withDefaults(
    defineProps<{
        variant?: 'primary' | 'outline' | 'quiet' | 'danger';
        /** Large is the height of the bottom bar's buttons. */
        size?: 'medium' | 'large';
        /** A round button that holds only an icon. It needs an aria-label. */
        icon?: boolean;
        /** Takes all the width that is left over in its row. */
        stretch?: boolean;
        type?: 'button' | 'submit';
        disabled?: boolean;
    }>(),
    {
        variant: 'primary',
        size: 'medium',
        icon: false,
        stretch: false,
        type: 'button',
        disabled: false,
    },
);
</script>

<template>
    <button
        :type="type"
        :disabled="disabled"
        class="app-button"
        :class="[`is-${variant}`, size, { icon, stretch }]"
    >
        <slot />
    </button>
</template>

<style scoped>
.app-button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-pill);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    font-weight: 500;
    line-height: var(--text-button--line-height);
    touch-action: manipulation;
    transition:
        background-color 120ms ease,
        opacity 120ms ease;
}

.app-button.medium {
    height: 44px;
    padding: 0 16px;
}

.app-button.large {
    height: 52px;
    padding: 0 20px;
}

.app-button.icon.medium {
    width: 44px;
    padding: 0;
}

.app-button.icon.large {
    width: 52px;
    padding: 0;
}

.app-button.stretch {
    flex: 1;
}

.app-button.is-primary {
    background-color: var(--color-accent);
    color: var(--color-on-accent);
    font-size: var(--text-button);
    font-weight: 600;
}

.app-button.is-outline {
    border-color: var(--color-control-border);
    color: var(--color-ink);
}

.app-button.is-danger {
    border-color: var(--color-feedback-wrong-text);
    color: var(--color-feedback-wrong-text);
}

.app-button.is-quiet {
    padding-inline: 8px;
    color: var(--color-muted);
}

/* A button that switches something on and off shows when it is on. */
.app-button[aria-pressed='true'] {
    border-color: var(--color-accent);
    color: var(--color-accent);
}

.app-button:active:not(:disabled) {
    opacity: 0.8;
}

.app-button:disabled {
    opacity: 0.45;
}

.app-button:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
