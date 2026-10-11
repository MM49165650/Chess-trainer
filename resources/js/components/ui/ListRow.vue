<script setup lang="ts">
// One row of a list: a title with an optional line under it, something small
// before it and something after it. Rows are separated by hairlines. With an
// href the whole row is a link.

import { Link } from '@inertiajs/vue3';

defineProps<{
    title: string;
    description?: string;
    href?: string;
}>();
</script>

<template>
    <component :is="href ? Link : 'div'" :href="href" class="list-row">
        <span v-if="$slots.leading" class="list-row-leading">
            <slot name="leading" />
        </span>
        <span class="list-row-text">
            <span class="list-row-title">{{ title }}</span>
            <span v-if="description" class="list-row-description">
                {{ description }}
            </span>
        </span>
        <span v-if="$slots.trailing" class="list-row-trailing">
            <slot name="trailing" />
        </span>
    </component>
</template>

<style scoped>
.list-row {
    display: flex;
    align-items: baseline;
    gap: 14px;
    min-height: 44px;
    padding: 13px 0;
    border-bottom: 1px solid var(--color-hairline);
    color: var(--color-ink);
}

a.list-row:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}

.list-row-leading {
    flex: none;
    min-width: 20px;
    color: var(--color-muted);
    font-size: var(--text-label);
    font-variant-numeric: tabular-nums;
}

.list-row-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.list-row-title {
    font-family: var(--font-serif);
    font-size: var(--text-title);
    line-height: var(--text-title--line-height);
}

.list-row-description {
    color: var(--color-muted);
    font-size: var(--text-caption);
    line-height: var(--text-caption--line-height);
}

.list-row-trailing {
    flex: none;
    align-self: center;
    color: var(--color-muted);
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
}
</style>
