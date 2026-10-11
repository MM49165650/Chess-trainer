<script setup lang="ts">
// A development-only page for trying the board component on a phone: a move,
// a promotion, and marking squares. It is not part of the site.

import { Head } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
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
import AppButton from '@/components/ui/AppButton.vue';
import {
    BOARD_SIZE_DEFAULT,
    type MarkFeedback,
    type MoveInput,
} from '@/components/board/types';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PROMOTION = '3r4/4P1k1/8/8/8/8/6K1/8 w - - 0 1';

// The position after 1. e4 e5 2. Nf3, with that golden position's answers.
const MARKING =
    'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
const ANSWERS = GOLDEN_POSITIONS[1];

// Black is in check from the bishop on b5 and has several ways out of it.
const CHECK = 'rnbqkbnr/ppp2ppp/8/1B1pp3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 3';

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

const checkFen = ref(CHECK);
const checkLastMove = ref<MoveParts | null>(null);
const checkMarking = ref(false);
const checkMarks = ref<Square[]>([]);

// The board's width on larger screens. It is kept in memory only, until the
// storage module of build step 14 saves it with the other settings.
const boardSize = ref<number | null>(null);
const boardSizeInPixels = computed(
    () => `${String(boardSize.value ?? BOARD_SIZE_DEFAULT)}px`,
);

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

function onCheckMove(move: MoveParts): void {
    const next = playMove(checkFen.value, move);

    if (next !== null) {
        checkFen.value = next;
        checkLastMove.value = move;
    }
}

function resetCheck(): void {
    checkFen.value = CHECK;
    checkLastMove.value = null;
    checkMarks.value = [];
}
</script>

<template>
    <Head title="Board demo" />

    <!-- On larger screens the text and controls stay in a fixed, centred column. -->
    <main class="pb-16 sm:mx-auto sm:w-[560px]">
        <h1 class="px-5 py-4 font-serif text-heading tracking-heading">
            Board demo
        </h1>
        <div class="hidden flex-wrap items-center gap-2 px-5 pb-2 sm:flex">
            <span class="tabular-nums">
                Chosen board size: {{ boardSizeInPixels
                }}{{ boardSize === null ? ' (the default)' : '' }}
            </span>
            <AppButton variant="outline" @click="boardSize = null">
                Default size
            </AppButton>
        </div>

        <section>
            <h2 class="px-5 py-2 font-serif text-title">1. Make a move</h2>
            <ChessBoard
                v-model:size="boardSize"
                resizable
                :fen="gameFen"
                :orientation="orientation"
                :move-input="moveInput"
                :last-move="gameLastMove"
                :show-last-move="showLastMove"
                movable
                @move="onGameMove"
            />
            <div class="flex flex-wrap gap-2 px-5 py-4">
                <AppButton variant="outline" @click="flip">
                    Flip board
                </AppButton>
                <AppButton
                    variant="outline"
                    :aria-pressed="showLastMove"
                    @click="showLastMove = !showLastMove"
                >
                    Last move: {{ showLastMove ? 'shown' : 'hidden' }}
                </AppButton>
                <AppButton variant="outline" @click="resetGame">
                    Reset
                </AppButton>
            </div>
            <div class="flex flex-wrap items-center gap-2 px-5">
                <span>Move input:</span>
                <AppButton
                    v-for="input in MOVE_INPUTS"
                    :key="input"
                    variant="outline"
                    :aria-pressed="moveInput === input"
                    @click="moveInput = input"
                >
                    {{ input }}
                </AppButton>
            </div>
            <p class="px-5 py-4 tabular-nums">
                Last move:
                {{ gameLastMove ? formatMove(gameLastMove) : 'none yet' }}
            </p>
        </section>

        <section>
            <h2 class="px-5 py-2 font-serif text-title">2. Promote a pawn</h2>
            <ChessBoard
                v-model:size="boardSize"
                resizable
                :fen="promotionFen"
                :orientation="orientation"
                :move-input="moveInput"
                :last-move="promotionLastMove"
                :show-last-move="showLastMove"
                movable
                @move="onPromotionMove"
            />
            <div class="flex flex-wrap gap-2 px-5 py-4">
                <AppButton variant="outline" @click="resetPromotion">
                    Reset
                </AppButton>
            </div>
            <p class="px-5 pb-4 tabular-nums">
                Last move:
                {{
                    promotionLastMove
                        ? formatMove(promotionLastMove)
                        : 'none yet'
                }}
            </p>
        </section>

        <section>
            <h2 class="px-5 py-2 font-serif text-title">3. Mark squares</h2>
            <p class="px-5 pb-2">
                White has just played Nf3. Mark the squares for the chosen
                phase, then check them.
            </p>
            <ChessBoard
                v-model:marks="marks"
                v-model:size="boardSize"
                resizable
                :fen="MARKING"
                :orientation="orientation"
                :show-last-move="false"
                :mark-phase="phase"
                :feedback="feedback"
            />
            <div class="flex flex-wrap items-center gap-2 px-5 py-4">
                <span>Phase:</span>
                <AppButton
                    v-for="name in PHASES"
                    :key="name"
                    variant="outline"
                    :aria-pressed="phase === name"
                    @click="setPhase(name)"
                >
                    {{ name }}
                </AppButton>
            </div>
            <div class="flex flex-wrap gap-2 px-5">
                <AppButton
                    variant="outline"
                    :disabled="feedback !== null"
                    @click="check"
                >
                    Check
                </AppButton>
                <AppButton variant="outline" @click="clearMarks">
                    Clear
                </AppButton>
            </div>
            <p class="px-5 py-4 tabular-nums">
                <template v-if="feedback">
                    {{ feedback.correct.length }} correct,
                    {{ feedback.missed.length }} missed,
                    {{ feedback.wrong.length }} wrong
                </template>
                <template v-else>{{ marks.length }} marked</template>
            </p>
        </section>

        <section>
            <h2 class="px-5 py-2 font-serif text-title">4. Check</h2>
            <p class="px-5 pb-2">
                Black is in check. The red highlight stays while squares are
                being marked.
            </p>
            <ChessBoard
                v-model:marks="checkMarks"
                v-model:size="boardSize"
                resizable
                :fen="checkFen"
                :orientation="orientation"
                :move-input="moveInput"
                :last-move="checkLastMove"
                :show-last-move="showLastMove"
                :mark-phase="checkMarking ? 'controlled' : null"
                movable
                @move="onCheckMove"
            />
            <div class="flex flex-wrap gap-2 px-5 py-4">
                <AppButton
                    variant="outline"
                    :aria-pressed="checkMarking"
                    @click="checkMarking = !checkMarking"
                >
                    Marking: {{ checkMarking ? 'on' : 'off' }}
                </AppButton>
                <AppButton variant="outline" @click="resetCheck">
                    Reset
                </AppButton>
            </div>
        </section>
    </main>
</template>
