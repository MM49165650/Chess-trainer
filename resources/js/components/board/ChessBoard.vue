<script setup lang="ts">
// The one wrapper around Chessground. The parent owns the position: the board
// reports a move and then shows whatever position it is given next.

import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import '@lichess-org/chessground/assets/chessground.base.css';
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';
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
import {
    isPromotionMove,
    movePlayedBetween,
    pieceTypeAt,
    readPosition,
} from '@/chess/position';
import { playMoveSound, SOUND_ENABLED } from '@/settings/sound';
import { useSettings } from '@/settings/useSettings';
import '../../../css/board.css';
import MarkingLayer from './MarkingLayer.vue';
import PromotionPicker from './PromotionPicker.vue';
import ResizeHandle from './ResizeHandle.vue';
import {
    BOARD_SIZE_DEFAULT,
    BOARD_SIZE_MAX,
    BOARD_SIZE_MIN,
    MOVE_ANIMATION_MS,
    type MarkFeedback,
    type MoveInput,
} from './types';

const props = withDefaults(
    defineProps<{
        /** The position to show. */
        fen: string;
        /** The side at the bottom of the board. */
        orientation?: Color;
        /** Whether the side to move may make a move. */
        movable?: boolean;
        /** How moves are made; the setting unless given. */
        moveInput?: MoveInput | null;
        lastMove?: MoveParts | null;
        showLastMove?: boolean;
        /** The phase being marked. Marking is off when this is null. */
        markPhase?: Phase | null;
        /** Feedback on a submitted phase, drawn in place of the marks. */
        feedback?: MarkFeedback | null;
        /** Marked squares to draw as wrong while the phase is still open. */
        wrongMarks?: readonly Square[];
        /** Whether larger screens get a handle to resize the board. */
        resizable?: boolean;
        /** How long the next change of position takes to animate. */
        animationMs?: number;
    }>(),
    {
        orientation: 'white',
        movable: false,
        moveInput: null,
        lastMove: null,
        showLastMove: true,
        markPhase: null,
        feedback: null,
        wrongMarks: () => [],
        resizable: false,
        animationMs: MOVE_ANIMATION_MS,
    },
);

const emit = defineEmits<{
    move: [move: MoveParts];
    /** A resize has ended: a drag was let go, or an arrow key pressed. */
    resized: [];
}>();

const marks = defineModel<Square[]>('marks', { default: () => [] });

// The width the user chose for the board on larger screens, in pixels. The
// board sizes and centres itself; the page around it does not change.
const size = defineModel<number | null>('size', { default: null });

const chosenSize = computed(
    () => `${String(size.value ?? BOARD_SIZE_DEFAULT)}px`,
);

const root = ref<HTMLElement | null>(null);
const wrap = ref<HTMLElement | null>(null);

// A pawn move that is waiting for its promotion piece.
const promotion = ref<{ move: MoveParts; color: Color } | null>(null);

let board: Api | null = null;

// The board theme, the piece set, move input and sound follow the settings.
const settings = useSettings();

function inputMode(): MoveInput {
    return props.moveInput ?? settings.moveInput;
}

function isMarking(): boolean {
    return props.markPhase !== null || props.feedback !== null;
}

// Pieces do not slide when the device asks for reduced motion.
function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        check: position.inCheck,
        coordinates: false,
        animation: {
            enabled: !prefersReducedMotion(),
            duration: props.animationMs,
        },
        highlight: {
            lastMove: true,
            check: true,
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
        draggable: { enabled: inputMode() !== 'tap' },
        selectable: { enabled: inputMode() !== 'drag' },
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

let widthAtDragStart = 0;

function currentWidth(): number {
    return root.value?.getBoundingClientRect().width ?? 0;
}

function resizeTo(width: number): void {
    size.value = Math.round(
        Math.min(BOARD_SIZE_MAX, Math.max(BOARD_SIZE_MIN, width)),
    );
}

function onResizeStart(): void {
    widthAtDragStart = currentWidth();
}

function onResizeDrag(change: number): void {
    resizeTo(widthAtDragStart + change);
}

function onResizeStep(change: number): void {
    resizeTo(currentWidth() + change);
    emit('resized');
}

function onResizeEnd(): void {
    emit('resized');
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
        inputMode(),
        props.lastMove,
        props.showLastMove,
        props.markPhase,
        props.feedback,
        props.animationMs,
    ],
    () => {
        promotion.value = null;
        sync();
    },
);

// A move played on the board makes a sound, when sound is offered and on: a
// new position that follows from the one before by a single legal move.
// Stepping back through a game, or a correction from one move to another,
// makes none.
watch(
    () => props.fen,
    (after, before) => {
        if (!SOUND_ENABLED || !settings.sound) {
            return;
        }

        const played = movePlayedBetween(before, after);

        if (played !== null) {
            playMoveSound(played.capture);
        }
    },
);
</script>

<template>
    <div
        ref="root"
        class="chess-board"
        :class="[`board-${settings.boardTheme}`, `pieces-${settings.pieceSet}`]"
        :style="{ '--board-size': chosenSize }"
    >
        <div ref="wrap" class="chess-board-wrap" />

        <MarkingLayer
            v-if="markPhase !== null || feedback !== null"
            v-model:marks="marks"
            :orientation="orientation"
            :phase="markPhase"
            :feedback="feedback"
            :wrong-marks="wrongMarks"
        />

        <!-- Something extra drawn over the squares, by the page that asks. -->
        <slot name="overlay" />

        <PromotionPicker
            v-if="promotion !== null"
            :color="promotion.color"
            @pick="onPromotionPick"
            @cancel="onPromotionCancel"
        />

        <ResizeHandle
            v-if="resizable"
            @start="onResizeStart"
            @drag="onResizeDrag"
            @step="onResizeStep"
            @end="onResizeEnd"
        />
    </div>
</template>

<style scoped>
/*
 * A page that knows how much room it has says so with --board-height-limit,
 * and the board is never shown taller than that. On a phone the board is the
 * full width of the screen unless the limit makes it smaller, down to 280
 * pixels, and it stays centred.
 */
.chess-board {
    --shown-size: min(100%, max(280px, var(--board-height-limit, 100%)));

    position: relative;
    width: var(--shown-size);
    margin-inline: calc((100% - var(--shown-size)) / 2);
    aspect-ratio: 1;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
}

/*
 * On larger screens the board has its own width and is centred on the column
 * it sits in, so it may be narrower or wider than that column. It is never
 * shown taller than the screen allows, whatever size was chosen.
 */
@media (min-width: 640px) {
    .chess-board {
        --shown-size: max(
            320px,
            min(
                var(--board-size),
                var(--board-height-limit, calc(100dvh - 120px)),
                100vw - 2rem
            )
        );
    }
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
