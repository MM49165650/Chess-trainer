<script setup lang="ts">
// One tactics puzzle being solved: the board, the prompt or the outcome, and
// the bottom bar with the arrows and the way on to the next puzzle.

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import ChessBoard from '@/components/board/ChessBoard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import BottomBar from '@/components/ui/BottomBar.vue';
import type { PuzzleData } from '@/generated/data';
import {
    SOLVER_MOVE_COUNT,
    useTacticsPuzzle,
} from '@/tactics/useTacticsPuzzle';

const props = defineProps<{
    puzzle: PuzzleData;
}>();

const emit = defineEmits<{
    next: [];
}>();

// Kept in memory only, until the settings arrive.
const boardSize = ref<number | null>(null);

const {
    fen,
    lastMove,
    status,
    solverColor,
    moveNumber,
    failed,
    lastAttemptWrong,
    solutionShown,
    outcome,
    move,
    canShowSolution,
    showSolution,
    canStepBack,
    canStepForward,
    stepBack,
    stepForward,
} = useTacticsPuzzle(props.puzzle);

const solverName = computed(() =>
    solverColor === 'white' ? 'White' : 'Black',
);

/** The short line in the bottom bar: how far along, or how it ended. */
const progress = computed(() => {
    if (outcome.value === 'solved') {
        return { figure: 'Solved', note: 'first time' };
    }

    if (outcome.value === 'failed') {
        return {
            figure: 'Failed',
            note: solutionShown.value ? 'solution shown' : 'first attempt',
        };
    }

    return {
        figure: `${String(moveNumber.value)} / ${String(SOLVER_MOVE_COUNT)}`,
        note: failed.value ? 'failed, retrying' : 'move',
    };
});

// The left and right arrow keys step through the puzzle once it is over,
// unless a control that uses them itself has the keyboard.
function onKeyDown(event: KeyboardEvent): void {
    const target = event.target instanceof Element ? event.target : null;

    if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target?.closest('input, textarea, select, dialog')
    ) {
        return;
    }

    if (event.key === 'ArrowLeft') {
        stepBack();
    } else if (event.key === 'ArrowRight') {
        stepForward();
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
    <ChessBoard
        v-model:size="boardSize"
        resizable
        :fen="fen"
        :orientation="solverColor"
        :last-move="lastMove"
        :movable="status === 'solve'"
        @move="move"
    />

    <!-- Screen readers hear each prompt and each outcome. -->
    <!--
        On larger screens the block keeps one height, so the board beside it
        does not change size as the text changes. The extra room above keeps
        it clear of the resize handle.
    -->
    <section
        class="flex flex-col gap-1.5 px-5 pt-4 pb-6 sm:min-h-48 sm:pt-6"
        aria-live="polite"
    >
        <template v-if="outcome === 'solved'">
            <p class="label-caps text-accent">Solved</p>
            <h1 class="font-serif text-heading tracking-heading">
                You found both moves.
            </h1>
            <p class="text-muted">
                Use the arrows to look back over the puzzle.
            </p>
        </template>

        <template v-else-if="outcome === 'failed'">
            <p class="label-caps text-wrong-text">Failed</p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ solutionShown ? 'Here is the solution.' : 'You got there.' }}
            </h1>
            <p class="text-muted">
                {{
                    solutionShown
                        ? 'Use the arrows to step through it, from the first move to the capture.'
                        : 'The first attempt decides, so this one counts as failed.'
                }}
            </p>
        </template>

        <template v-else>
            <p class="label-caps text-muted">
                Move {{ moveNumber }} of {{ SOLVER_MOVE_COUNT }} ·
                {{ solverName }} to move
            </p>
            <h1 class="font-serif text-heading tracking-heading">
                Win material with the {{ puzzle.piece }}.
            </h1>

            <template v-if="lastAttemptWrong">
                <p class="text-muted">
                    <span class="font-semibold text-wrong-text">
                        Not that move.
                    </span>
                    The puzzle is failed. Try again, or see the answer.
                </p>
            </template>
            <p v-else-if="status === 'setup'" class="text-muted">
                First, the opponent's move.
            </p>
            <p v-else-if="status === 'reply'" class="font-semibold text-accent">
                Correct. The opponent replies.
            </p>
            <p v-else-if="moveNumber > 1" class="text-muted">
                Now finish with the same piece.
            </p>
            <p v-else class="text-muted">
                Two moves with the same piece, ending in a capture.
            </p>

            <div v-if="canShowSolution" class="pt-3">
                <AppButton variant="outline" @click="showSolution">
                    Show solution
                </AppButton>
            </div>
        </template>
    </section>

    <BottomBar>
        <div class="flex min-w-0 flex-1 items-center justify-between gap-3">
            <p class="flex min-w-0 flex-col">
                <span class="font-serif text-heading tabular-nums">
                    {{ progress.figure }}
                </span>
                <span class="text-label text-muted">{{ progress.note }}</span>
            </p>
            <div class="flex flex-none items-center gap-2">
                <AppButton
                    variant="outline"
                    icon
                    aria-label="Previous move"
                    :disabled="!canStepBack"
                    @click="stepBack"
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
                        <path d="M15 5l-7 7 7 7" />
                    </svg>
                </AppButton>
                <AppButton
                    variant="outline"
                    icon
                    aria-label="Next move"
                    :disabled="!canStepForward"
                    @click="stepForward"
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
                        <path d="M9 5l7 7-7 7" />
                    </svg>
                </AppButton>
                <AppButton :disabled="outcome === null" @click="emit('next')">
                    Next puzzle
                </AppButton>
            </div>
        </div>
    </BottomBar>
</template>
