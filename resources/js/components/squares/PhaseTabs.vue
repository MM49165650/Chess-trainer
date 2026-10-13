<script setup lang="ts">
// The phase indicator of square control: three tabs that show which phase
// is being marked and how the earlier ones came out. On a castling move the
// tabs are King, Rook and Hanging, and the first two stand for two phases
// each, lost and then controlled.

import { computed } from 'vue';
import type { PhaseStep } from '@/squares/phases';
import { phaseName, tabsOf } from '@/squares/wording';

const props = defineProps<{
    /** The phases of the move, in order. */
    steps: readonly PhaseStep[];
    /** Which of them is the current one, counting from 0. */
    index: number;
    /** How the phases submitted so far came out, in order. */
    results: readonly boolean[];
}>();

type Mark = 'right' | 'wrong' | 'current' | 'waiting';

const STATE_WORDS: Readonly<Record<Mark, string>> = {
    right: 'exactly right',
    wrong: 'not right',
    current: 'now',
    waiting: 'to come',
};

function markOf(step: number): Mark {
    const result = props.results[step];

    if (result !== undefined) {
        return result ? 'right' : 'wrong';
    }

    return step === props.index ? 'current' : 'waiting';
}

const tabs = computed(() =>
    tabsOf(props.steps).map((tab) => ({
        label: tab.label,
        current: tab.steps.includes(props.index),
        marks: tab.steps.flatMap((at) => {
            const step = props.steps[at];

            return step === undefined
                ? []
                : [
                      {
                          at,
                          phase: step.phase,
                          mark: markOf(at),
                          name: phaseName(step, props.steps),
                      },
                  ];
        }),
    })),
);

/** The current tab is underlined in the colour of the phase being marked. */
const currentPhase = computed(() => props.steps[props.index]?.phase ?? null);
</script>

<template>
    <ol class="phase-tabs" :class="currentPhase" aria-label="Phases">
        <li
            v-for="tab in tabs"
            :key="tab.label"
            class="phase-tab"
            :class="{ current: tab.current }"
            :aria-current="tab.current ? 'step' : undefined"
        >
            <span
                v-for="item in tab.marks"
                :key="item.at"
                class="phase-mark"
                :class="[item.phase, item.mark]"
            >
                <svg
                    v-if="item.mark === 'right'"
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                <svg
                    v-else-if="item.mark === 'wrong'"
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                >
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                <span v-else class="phase-square" aria-hidden="true" />
                <span class="sr-only">
                    {{ item.name }}, {{ STATE_WORDS[item.mark] }}.
                </span>
            </span>
            <span aria-hidden="true">{{ tab.label }}</span>
        </li>
    </ol>
</template>

<style scoped>
.phase-tabs {
    display: flex;
    padding: 6px 20px 0;
    border-bottom: 1px solid var(--color-hairline);
}

.phase-tabs.lost {
    --phase-current: var(--color-mark-lost);
}

.phase-tabs.controlled {
    --phase-current: var(--color-mark-controlled);
}

.phase-tabs.hanging {
    --phase-current: var(--color-mark-hanging);
}

.phase-tab {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 7px;
    min-width: 0;
    padding: 10px 0 12px;
    color: var(--color-muted);
    font-size: var(--text-body);
    line-height: 1.2;
}

/* Less room on a short phone screen, so the board has more. */
@media (max-width: 639px) and (max-height: 760px) {
    .phase-tab {
        padding: 6px 0 8px;
    }
}

/* The last tab sits against the right edge, as the first sits on the left. */
.phase-tab:last-child {
    justify-content: flex-end;
}

.phase-tab.current {
    box-shadow: inset 0 -2px 0 var(--phase-current);
    color: var(--color-ink);
    font-weight: 600;
}

/* Every mark takes the same room, so the label does not shift. */
.phase-mark {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
}

.phase-mark.lost {
    --phase: var(--color-mark-lost);
}

.phase-mark.controlled {
    --phase: var(--color-mark-controlled);
}

.phase-mark.hanging {
    --phase: var(--color-mark-hanging);
}

.phase-mark.right {
    color: var(--phase);
}

.phase-mark.wrong {
    color: var(--color-feedback-wrong-text);
}

.phase-square {
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--phase);
    border-radius: var(--radius-tick);
}

.phase-mark.current .phase-square {
    background-color: var(--phase);
}
</style>
