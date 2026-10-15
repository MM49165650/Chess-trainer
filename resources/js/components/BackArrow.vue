<script setup lang="ts">
// The back arrow of a play screen's header. It returns to the page the user
// came from on this site, or else to the screen's parent page.

import { goBack } from '@/navigation';

const props = defineProps<{
    /** The screen's parent page, for when there is no page to return to. */
    parent: string;
    label: string;
}>();

// A click with a modifier key, such as one to open a new tab, is left to the
// browser, which then opens the parent page.
function onClick(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
    }

    event.preventDefault();
    goBack(props.parent);
}
</script>

<template>
    <a
        :href="parent"
        class="flex size-11 flex-none items-center justify-center"
        :aria-label="label"
        @click="onClick"
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
    </a>
</template>
