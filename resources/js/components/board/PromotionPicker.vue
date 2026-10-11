<script setup lang="ts">
import {
    PROMOTION_PIECES,
    type Color,
    type PromotionLetter,
} from '@/chess/conventions';

defineProps<{
    color: Color;
}>();

const emit = defineEmits<{
    pick: [letter: PromotionLetter];
    cancel: [];
}>();

const LETTERS: readonly PromotionLetter[] = ['q', 'r', 'b', 'n'];
</script>

<template>
    <div
        class="promotion-picker"
        role="dialog"
        aria-label="Choose a piece to promote to"
        @click.self="emit('cancel')"
    >
        <div class="promotion-choices">
            <button
                v-for="letter in LETTERS"
                :key="letter"
                type="button"
                class="promotion-choice"
                :aria-label="`Promote to ${PROMOTION_PIECES[letter]}`"
                @click="emit('pick', letter)"
            >
                <span
                    class="piece-image"
                    :class="[color, PROMOTION_PIECES[letter]]"
                />
            </button>
        </div>
    </div>
</template>

<style scoped>
.promotion-picker {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--color-surface) 60%, transparent);
}

.promotion-choices {
    display: flex;
    gap: 2%;
    width: 92%;
}

.promotion-choice {
    flex: 1;
    aspect-ratio: 1;
    border: 1px solid var(--color-hairline);
    border-radius: 12%;
    background-color: var(--color-surface);
    touch-action: manipulation;
}

.promotion-choice:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}

.piece-image {
    display: block;
    width: 100%;
    height: 100%;
}
</style>
