<script setup lang="ts">
// A marking mode's percentages, as on its landing page and the progress
// page: each phase's running percentage since the start, and under it the
// last seven days and the seven before, each shown once it holds enough
// phases. One column per phase.

import type { Phase } from '@/chess/conventions';
import type { MarkingMode } from '@/marking/phases';
import {
    emptyScores,
    percentage,
    windowPercentage,
    type RunningScore,
} from '@/marking/tallies';
import { scoreLabel } from '@/marking/wording';
import type { RecentScore } from '@/storage/marking';

const props = defineProps<{
    mode: MarkingMode;
    /** The running scores, or null until the browser has said. */
    scores: RunningScore[] | null;
    /** The two windows' totals per phase. */
    recent: RecentScore[] | null;
}>();

const NOTHING = { attempts: 0, correct: 0 };

function recentOf(phase: Phase): RecentScore | undefined {
    return props.recent?.find((score) => score.phase === phase);
}
</script>

<template>
    <dl class="flex">
        <div
            v-for="score in scores ?? emptyScores(mode)"
            :key="score.phase"
            class="flex flex-1 flex-col gap-0.5"
        >
            <dt class="text-label text-muted">
                {{ scoreLabel(score.phase, true) }}
            </dt>
            <dd class="font-serif text-title tabular-nums">
                {{ percentage(score.tally) }}
            </dd>
            <dd class="mt-0.5 text-caption text-muted tabular-nums">
                Last 7 days
                {{ windowPercentage(recentOf(score.phase)?.recent ?? NOTHING) }}
            </dd>
            <dd class="text-caption text-muted tabular-nums">
                The 7 before
                {{ windowPercentage(recentOf(score.phase)?.before ?? NOTHING) }}
            </dd>
        </div>
    </dl>
</template>
