<script setup lang="ts">
// The one wrapper around Chessground. The parent owns the position: the board
// reports a move and then shows whatever position it is given next.

import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import '@lichess-org/chessground/assets/chessground.base.css';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
    isLightSquare,
    isSquare,
    normalizeCastling,
    type Color,
    type MoveParts,
    type Phase,
    type PromotionLetter,
    type Square,
} from '@/chess/conventions';
import { isPromotionMove, pieceTypeAt, readPosition } from '@/chess/position';
import '../../../css/board.css';
import MarkingLayer from './MarkingLayer.vue';
import PromotionPicker from './PromotionPicker.vue';
import type { MarkFeedback, MoveInput } from './types';

const props = withDefaults(
    defineProps<{
        /** The position to show. */
        fen: string;
        /** The side at the bottom of the board. */
        orientation?: Color;
        /** Whether the side to move may make a move. */
        movable?: boolean;
        moveInput?: MoveInput;
        lastMove?: MoveParts | null;
        showLastMove?: boolean;
        /** The phase being marked. Marking is off when this is null. */
        markPhase?: Phase | null;
        /** Feedback on a submitted phase, drawn in place of the marks. */
        feedback?: MarkFeedback | null;
    }>(),
    {
        orientation: 'white',
        movable: false,
        moveInput: 'both',
        lastMove: null,
        showLastMove: true,
        markPhase: null,
        feedback: null,
    },
);

const emit = defineEmits<{
    move: [move: MoveParts];
}>();

const marks = defineModel<Square[]>('marks', { default: () => [] });

const wrap = ref<HTMLElement | null>(null);

// A pawn move that is waiting for its promotion piece.
const promotion = ref<{ move: MoveParts; color: Color } | null>(null);

let board: Api | null = null;

function isMarking(): boolean {
    return props.markPhase !== null || props.feedback !== null;
}

function config(): Config {
    const position = readPosition(props.fen);
    const canMove = props.movable && !isMarking();
    const lastMove = props.showLastMove ? props.lastMove : null;

    // The highlight colour depends on the shade of the square under it.
    const shades = new Map<Key, string>();

    for (const square of lastMove ? [lastMove.from, lastMove.to] : []) {
        shades.set(square, isLightSquare(square) ? 'on-light' : 'on-dark');
    }

    return {
        fen: props.fen,
        orientation: props.orientation,
        turnColor: position.turn,
        lastMove: lastMove ? [lastMove.from, lastMove.to] : undefined,
        coordinates: false,
        highlight: {
            lastMove: true,
            check: false,
            custom: shades,
        },
        movable: {
            free: false,
            color: canMove ? position.turn : undefined,
            dests: canMove ? position.destinations : new Map<Key, Key[]>(),
            showDests: true,
            events: { after: onBoardMove },
        },
        premovable: { enabled: false },
        draggable: { enabled: props.moveInput !== 'tap' },
        selectable: { enabled: props.moveInput !== 'drag' },
        drawable: { enabled: false },
    };
}

function sync(): void {
    board?.set(config());
}

function report(move: MoveParts): void {
    emit('move', move);

    // Show the parent's position again, in case it did not accept the move.
    void nextTick(sync);
}

function onBoardMove(from: Key, to: Key): void {
    if (!isSquare(from) || !isSquare(to)) {
        return;
    }

    const piece = pieceTypeAt(props.fen, from);
    const reported: MoveParts = { from, to, promotion: null };

    // Chessground can report castling as the king moving onto its rook.
    const move = piece ? normalizeCastling(reported, piece) : reported;

    if (isPromotionMove(props.fen, move.from, move.to)) {
        promotion.value = { move, color: readPosition(props.fen).turn };

        return;
    }

    report(move);
}

function onPromotionPick(letter: PromotionLetter): void {
    const pending = promotion.value;

    if (pending === null) {
        return;
    }

    promotion.value = null;
    report({ ...pending.move, promotion: letter });
}

function onPromotionCancel(): void {
    promotion.value = null;

    // Puts the pawn back.
    sync();
}

onMounted(() => {
    if (wrap.value !== null) {
        board = Chessground(wrap.value, config());
    }
});

onBeforeUnmount(() => {
    board?.destroy();
    board = null;
});

watch(
    () => [
        props.fen,
        props.orientation,
        props.movable,
        props.moveInput,
        props.lastMove,
        props.showLastMove,
        props.markPhase,
        props.feedback,
    ],
    () => {
        promotion.value = null;
        sync();
    },
);
</script>

<template>
    <div class="chess-board board-olive pieces-maestro">
        <div ref="wrap" class="chess-board-wrap" />

        <MarkingLayer
            v-if="markPhase !== null || feedback !== null"
            v-model:marks="marks"
            :orientation="orientation"
            :phase="markPhase"
            :feedback="feedback"
        />

        <PromotionPicker
            v-if="promotion !== null"
            :color="promotion.color"
            @pick="onPromotionPick"
            @cancel="onPromotionCancel"
        />
    </div>
</template>

<style scoped>
.chess-board {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

.chess-board-wrap {
    width: 100%;
    height: 100%;
}

/*
 * Chessground rounds the board down to a whole number of pixels per square,
 * which leaves a strip beside it. The board runs edge to edge instead.
 */
.chess-board-wrap :deep(cg-container) {
    width: 100% !important;
    height: 100% !important;
}
</style>
