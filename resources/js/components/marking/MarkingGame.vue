<script setup lang="ts">
// One practice game in a marking mode: the phase tabs, the move in words
// with the question or the outcome, the board with its marks, the legend,
// and the bottom bar with the rewind button and the main action.

import { computed } from 'vue';
import ChessBoard from '@/components/board/ChessBoard.vue';
import { useBoardSize } from '@/components/board/useBoardSize';
import AppButton from '@/components/ui/AppButton.vue';
import BottomBar from '@/components/ui/BottomBar.vue';
import type { PracticeGamePlayData } from '@/generated/data';
import type { MarkingMode } from '@/marking/phases';
import { percentage, type RunningScore } from '@/marking/tallies';
import {
    MARKING_MOVE_ANIMATION_MS,
    useMarkingGame,
    type GameStart,
    type PhaseResult,
    type ResumePoint,
} from '@/marking/useMarkingGame';
import {
    markingLabel,
    moveInWords,
    nextLabel,
    phaseName,
    questionOf,
    scoreLabel,
    verdictOf,
} from '@/marking/wording';
import PhaseTabs from './PhaseTabs.vue';

const props = defineProps<{
    game: PracticeGamePlayData;
    /** Square control, or spot the hanging piece. */
    mode: MarkingMode;
    /** The saved phase to resume at; without it the game starts at move 1. */
    start?: GameStart | undefined;
    /** The mode's running percentages, shown while a phase is marked. */
    scores: readonly RunningScore[];
}>();

const emit = defineEmits<{
    /**
     * When a phase ends: where the game stands next, or null once the game
     * is finished.
     */
    progress: [ended: PhaseResult, next: ResumePoint | null];
    /** After the last phase of the last move, when the user moves on. */
    next: [];
}>();

// The size outlasts this game: the next one opens at the same size.
const { boardSize, saveBoardSize } = useBoardSize();

const {
    ply,
    move,
    steps,
    stepIndex,
    step,
    started,
    fen,
    fenBefore,
    marks,
    wrongMarks,
    markPhase,
    feedback,
    exact,
    corrected,
    moveResults,
    rewound,
    isLastMove,
    finished,
    submit,
    next,
    toggleRewind,
} = useMarkingGame(
    props.game,
    props.mode,
    (result, following) => {
        emit('progress', result, following);
    },
    props.start,
);

/** The number a game score gives the move: both sides' first is move 1. */
const moveNumber = computed(() => Math.ceil(ply.value / 2));

const played = computed(() =>
    move.value === null
        ? null
        : moveInWords(ply.value, move.value, fenBefore.value),
);

const question = computed(() =>
    step.value === null || move.value === null
        ? ''
        : questionOf(step.value, move.value),
);

const verdict = computed(() =>
    feedback.value === null || step.value === null
        ? null
        : verdictOf(feedback.value, step.value.phase),
);

/**
 * How the phase came out, in a word or two. "Exactly right" is only for a
 * phase in which no wrong square was marked at any point.
 */
const outcome = computed(() => {
    if (exact.value !== true) {
        return 'Not quite';
    }

    return corrected.value ? 'Corrected' : 'Exactly right';
});

/** The outcome is the headline unless the earlier position is on show. */
const showsOutcome = computed(() => feedback.value !== null && !rewound.value);

const legend = computed(() =>
    feedback.value === null
        ? []
        : [
              { kind: 'correct', count: feedback.value.correct.length },
              { kind: 'missed', count: feedback.value.missed.length },
              { kind: 'wrong', count: feedback.value.wrong.length },
          ],
);

const mainLabel = computed(() => {
    if (feedback.value !== null) {
        return nextLabel(steps.value, stepIndex.value, isLastMove.value);
    }

    return markingLabel(props.mode, marks.value.length);
});

function onMain(): void {
    if (feedback.value === null) {
        submit();
    } else if (finished.value) {
        emit('next');
    } else {
        next();
    }
}
</script>

<template>
    <PhaseTabs :steps="steps" :index="stepIndex" :results="moveResults" />

    <!--
        Screen readers hear each question and each outcome. The heading
        keeps room for two lines, so the board does not move as it changes.
    -->
    <section
        class="flex flex-col gap-1 px-5 pt-4 pb-3.5 short:pt-2 short:pb-1.5"
        aria-live="polite"
    >
        <p
            v-if="showsOutcome && step !== null"
            class="label-caps"
            :class="
                exact && !corrected
                    ? 'text-accent'
                    : 'text-(--color-feedback-wrong-text)'
            "
        >
            {{ finished ? 'End of the game' : `Move ${String(moveNumber)}` }}
            · {{ phaseName(step, steps) }} ·
            {{ outcome }}
        </p>
        <!-- A game resumed at a later move opens on the position before it. -->
        <p v-else-if="!started" class="label-caps text-muted">
            {{
                ply === 1
                    ? 'The starting position'
                    : `Before move ${String(moveNumber)}`
            }}
        </p>
        <p v-else-if="played !== null" class="label-caps text-muted">
            {{ rewound ? 'Before move' : 'Move' }} {{ moveNumber }} ·
            {{ played.words }}
            <!-- A written move keeps its own case: Nf3, not NF3. -->
            <span v-if="played.san !== null" class="normal-case">
                {{ played.san }}
            </span>
        </p>

        <h1 class="min-h-[2lh] font-serif text-heading tracking-heading">
            {{ showsOutcome && verdict !== null ? verdict : question }}
        </h1>
    </section>

    <!-- The move's squares are not highlighted in this mode. -->
    <ChessBoard
        v-model:marks="marks"
        v-model:size="boardSize"
        resizable
        :fen="fen"
        :show-last-move="false"
        :mark-phase="markPhase"
        :feedback="feedback"
        :wrong-marks="wrongMarks"
        :animation-ms="MARKING_MOVE_ANIMATION_MS"
        @resized="saveBoardSize"
    />

    <!-- The legend keeps its room, so nothing below the board moves. Until
         the phase ends, the room holds the running percentages. -->
    <ul v-if="legend.length > 0" class="legend">
        <li v-for="item in legend" :key="item.kind" class="legend-item">
            <span class="swatch" :class="item.kind" aria-hidden="true" />
            <span>
                <span class="font-semibold tabular-nums">{{ item.count }}</span>
                {{ item.kind }}
            </span>
        </li>
    </ul>
    <p v-else class="legend scores">
        <template v-for="(score, index) in scores" :key="score.phase">
            <span v-if="index > 0" class="text-muted" aria-hidden="true">
                ·
            </span>
            <span>
                <span class="text-muted">{{ scoreLabel(score.phase) }}</span>
                {{ ' ' }}
                <span class="font-semibold tabular-nums">
                    {{ percentage(score.tally) }}
                </span>
            </span>
        </template>
    </p>

    <BottomBar>
        <AppButton
            variant="outline"
            size="large"
            icon
            :aria-pressed="rewound"
            :disabled="!started"
            aria-label="Show the position before the move"
            @click="toggleRewind"
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
                <path d="M8 5L3 10l5 5M3 10h10a5 5 0 0 1 0 10h-3" />
            </svg>
        </AppButton>
        <AppButton size="large" stretch :disabled="!started" @click="onMain">
            {{ mainLabel }}
        </AppButton>
    </BottomBar>
</template>

<style scoped>
.legend {
    display: flex;
    min-height: 54px;
    padding: 16px 20px 0;
}

/* Less room on a short phone screen, so the board has more. */
@media (max-width: 639px) and (max-height: 800px) {
    .legend {
        min-height: 30px;
        padding-top: 6px;
    }
}

.scores {
    align-items: center;
    gap: 8px;
}

.legend-item {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 8px;
}

.legend-item:last-child {
    justify-content: flex-end;
}

/* The three kinds differ in shape as well as colour, as on the board. */
.swatch {
    box-sizing: border-box;
    flex: none;
    width: 18px;
    height: 18px;
    border: 3px solid var(--color-feedback-correct);
}

.swatch.correct {
    background-color: color-mix(
        in srgb,
        var(--color-feedback-correct) 50%,
        transparent
    );
}

.swatch.missed {
    border-style: dashed;
    border-color: var(--color-feedback-missed);
}

.swatch.wrong {
    border-color: var(--color-feedback-wrong);
    background-color: color-mix(
        in srgb,
        var(--color-feedback-wrong) 55%,
        transparent
    );
}
</style>
