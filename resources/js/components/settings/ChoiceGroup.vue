<script setup lang="ts" generic="T extends string | boolean">
// A row of choices of which one is picked, such as Light, Dark and Match
// device. They are radio buttons, so the arrow keys move between them.

import { useId } from 'vue';

defineProps<{
    /** What the choice is about, for screen readers. */
    label: string;
    options: readonly { value: T; label: string }[];
}>();

const chosen = defineModel<T>({ required: true });

const name = useId();
</script>

<template>
    <div role="radiogroup" :aria-label="label" class="choice-group">
        <label
            v-for="option in options"
            :key="String(option.value)"
            class="choice"
        >
            <input
                v-model="chosen"
                type="radio"
                class="sr-only"
                :name="name"
                :value="option.value"
            />
            <span>{{ option.label }}</span>
        </label>
    </div>
</template>

<style scoped>
.choice-group {
    display: flex;
    gap: 6px;
}

.choice {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 8px;
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius-pill);
    color: var(--color-ink);
    font-size: var(--text-body);
    font-weight: 600;
    text-align: center;
    white-space: nowrap;
    cursor: pointer;
    touch-action: manipulation;
}

.choice:has(input:checked) {
    border-color: var(--color-accent);
    background-color: var(--color-accent);
    color: var(--color-on-accent);
}

.choice:has(input:focus-visible) {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
