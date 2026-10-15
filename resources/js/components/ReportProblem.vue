<script setup lang="ts">
// The report a problem flag, for a play screen's header. It is there only
// once there is something to report, and opens a new GitHub issue, filled
// in, in a new tab. It is the height of the header, so the screen keeps its
// height when it appears.

import { computed } from 'vue';
import { reportUrl, type ProblemReport } from '@/report';

const props = withDefaults(
    defineProps<{
        /** What there is to report, or null while there is nothing. */
        report: ProblemReport | null;
        /** Keeps the flag's room while it is not there. */
        keepRoom?: boolean;
    }>(),
    { keepRoom: false },
);

const href = computed(() =>
    props.report === null ? null : reportUrl(props.report),
);
</script>

<template>
    <a
        v-if="href !== null"
        :href="href"
        target="_blank"
        rel="noopener"
        class="flex size-11 flex-none items-center justify-center text-muted"
        aria-label="Report a problem"
        title="Report a problem"
    >
        <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
        </svg>
    </a>
    <span v-else-if="keepRoom" class="size-11 flex-none" aria-hidden="true" />
</template>
