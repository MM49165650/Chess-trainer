<script setup lang="ts">
// A development-only page for trying the board component on a phone: a move,
// a promotion, and marking squares. It is not part of the site.

import { Head } from '@inertiajs/vue3';
import { ref } from 'vue';
import {
    formatMove,
    PHASES,
    type Color,
    type MoveParts,
    type Phase,
    type Square,
} from '@/chess/conventions';
import { GOLDEN_POSITIONS } from '@/chess/golden-positions';
import { playMove } from '@/chess/position';
import ChessBoard from '@/components/board/ChessBoard.vue';
import type { MarkFeedback, MoveInput } from '@/components/board/types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PROMOTION = '3r4/4P1k1/8/8/8/8/6K1/8 w - - 0 1';

// The position after 1. e4 e5 2. Nf3, with that golden position's answers.
const MARKING =
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
const ANSWERS = GOLDEN_POSITIONS[1];

const MOVE_INPUTS: readonly MoveInput[] = ['tap', 'drag', 'both'];

const orientation = ref<Color>('white');
const showLastMove = ref(true);
const moveInput = ref<MoveInput>('both');

const gameFen = ref(START);
const gameLastMove = ref<MoveParts | null>(null);

const promotionFen = ref(PROMOTION);
const promotionLastMove = ref<MoveParts | null>(null);

const phase = ref<Phase>('controlled');
const marks = ref<Square[]>([]);
const feedback = ref<MarkFeedback | null>(null);

function flip(): void {
    orientation.value = orientation.value === 'white' ? 'black' : 'white';
}

function onGameMove(move: MoveParts): void {
    const next = playMove(gameFen.value, move);

    if (next !== null) {
        gameFen.value = next;
        gameLastMove.value = move;
    }
}

function onPromotionMove(move: MoveParts): void {
    const next = playMove(promotionFen.value, move);

    if (next !== null) {
        promotionFen.value = next;
        promotionLastMove.value = move;
    }
}

function resetGame(): void {
    gameFen.value = START;
    gameLastMove.value = null;
}

function resetPromotion(): void {
    promotionFen.value = PROMOTION;
    promotionLastMove.value = null;
}

function setPhase(next: Phase): void {
    phase.value = next;
    marks.value = [];
    feedback.value = null;
}

function check(): void {
    const expected = ANSWERS?.[phase.value] ?? [];

    feedback.value = {
        correct: marks.value.filter((square) => expected.includes(square)),
        missed: expected.filter((square) => !marks.value.includes(square)),
        wrong: marks.value.filter((square) => !expected.includes(square)),
    };
}

function clearMarks(): void {
    marks.value = [];
    feedback.value = null;
}
</script>

<template>
    <Head title="Board demo" />

    <main class="pb-16">
        <h1 class="p-4 text-2xl font-semibold">Board demo</h1>

        <section>
            <h2 class="px-4 py-2 text-lg font-semibold">1. Make a move</h2>
            <ChessBoard
                :fen="gameFen"
                :orientation="orientation"
                :move-input="moveInput"
                :last-move="gameLastMove"
                :show-last-move="showLastMove"
                movable
                @move="onGameMove"
            />
            <div class="flex flex-wrap gap-2 p-4">
                <button type="button" class="demo-button" @click="flip">
                    Flip board
                </button>
                <button
                    type="button"
                    class="demo-button"
                    :aria-pressed="showLastMove"
                    @click="showLastMove = !showLastMove"
                >
                    Last move: {{ showLastMove ? 'shown' : 'hidden' }}
                </button>
                <button type="button" class="demo-button" @click="resetGame">
                    Reset
                </button>
            </div>
            <div class="flex flex-wrap items-center gap-2 px-4">
                <span>Move input:</span>
                <button
                    v-for="input in MOVE_INPUTS"
                    :key="input"
                    type="button"
                    class="demo-button"
                    :aria-pressed="moveInput === input"
                    @click="moveInput = input"
                >
                    {{ input }}
                </button>
            </div>
            <p class="p-4 tabular-nums">
                Last move:
                {{ gameLastMove ? formatMove(gameLastMove) : 'none yet' }}
            </p>
        </section>

        <section>
            <h2 class="px-4 py-2 text-lg font-semibold">2. Promote a pawn</h2>
            <ChessBoard
                :fen="promotionFen"
                :orientation="orientation"
                :move-input="moveInput"
                :last-move="promotionLastMove"
                :show-last-move="showLastMove"
                movable
                @move="onPromotionMove"
            />
            <div class="flex flex-wrap gap-2 p-4">
                <button
                    type="button"
                    class="demo-button"
                    @click="resetPromotion"
                >
                    Reset
                </button>
            </div>
            <p class="px-4 pb-4 tabular-nums">
                Last move:
                {{
                    promotionLastMove
                        ? formatMove(promotionLastMove)
                        : 'none yet'
                }}
            </p>
        </section>

        <section>
            <h2 class="px-4 py-2 text-lg font-semibold">3. Mark squares</h2>
            <p class="px-4 pb-2">
                White has just played Nf3. Mark the squares for the chosen
                phase, then check them.
            </p>
            <ChessBoard
                v-model:marks="marks"
                :fen="MARKING"
                :orientation="orientation"
                :show-last-move="false"
                :mark-phase="phase"
                :feedback="feedback"
            />
            <div class="flex flex-wrap items-center gap-2 p-4">
                <span>Phase:</span>
                <button
                    v-for="name in PHASES"
                    :key="name"
                    type="button"
                    class="demo-button"
                    :aria-pressed="phase === name"
                    @click="setPhase(name)"
                >
                    {{ name }}
                </button>
            </div>
            <div class="flex flex-wrap gap-2 px-4">
                <button
                    type="button"
                    class="demo-button"
                    :disabled="feedback !== null"
                    @click="check"
                >
                    Check
                </button>
                <button type="button" class="demo-button" @click="clearMarks">
                    Clear
                </button>
            </div>
            <p class="p-4 tabular-nums">
                <template v-if="feedback">
                    {{ feedback.correct.length }} correct,
                    {{ feedback.missed.length }} missed,
                    {{ feedback.wrong.length }} wrong
                </template>
                <template v-else>{{ marks.length }} marked</template>
            </p>
        </section>
    </main>
</template>

<style scoped>
.demo-button {
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-hairline);
    border-radius: 9999px;
    background-color: var(--color-surface);
}

.demo-button[aria-pressed='true'] {
    border-color: var(--color-accent);
    outline: 2px solid var(--color-accent);
}

.demo-button:disabled {
    opacity: 0.5;
}
</style>
