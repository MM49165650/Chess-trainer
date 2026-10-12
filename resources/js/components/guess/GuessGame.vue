<script setup lang="ts">
// One master game being guessed: the board, the two players, the prompt or
// the result of the last guess, and the running score in the bottom bar.

import { computed, ref } from 'vue';
import { colorOfPly } from '@/chess/conventions';
import { isCapture, isCastling } from '@/chess/game';
import ChessBoard from '@/components/board/ChessBoard.vue';
import {
    CORRECTION_ANIMATION_MS,
    MOVE_ANIMATION_MS,
} from '@/components/board/types';
import AppButton from '@/components/ui/AppButton.vue';
import AppSlider from '@/components/ui/AppSlider.vue';
import BottomBar from '@/components/ui/BottomBar.vue';
import SlideUpPanel from '@/components/ui/SlideUpPanel.vue';
import type { MasterGameData } from '@/generated/data';
import {
    REPLY_DELAY_DEFAULT,
    REPLY_DELAY_MAX,
    REPLY_DELAY_MIN,
    useGuessGame,
} from '@/guess/useGuessGame';
import type { MasterGameRecord } from '@/storage/types';

const props = defineProps<{
    game: MasterGameData;
    /** The game's record from an earlier visit, if there is one. */
    saved: MasterGameRecord | null;
    /** Whether the browser has storage to save progress in. */
    canSave: boolean;
}>();

// Both are kept in memory only, until the settings arrive.
const delaySeconds = ref(REPLY_DELAY_DEFAULT);
const boardSize = ref<number | null>(null);
const delayPanelOpen = ref(false);

const {
    ply,
    fen,
    lastMove,
    status,
    guesses,
    correctCount,
    result,
    resultIsFresh,
    secondsLeft,
    notSaved,
    guess,
    restart,
} = useGuessGame(props.game, delaySeconds, props.saved, props.canSave);

/** The master's family name, as in "What did Capablanca play?". */
const masterShortName = computed(
    () => props.game.master.name.split(' ').at(-1) ?? props.game.master.name,
);

const opponentColor = computed(() =>
    props.game.master_color === 'white' ? 'black' : 'white',
);

/** A move with its number, as in "9. exd5" or "8… d5". */
function numbered(plyNumber: number): string {
    const san = props.game.moves[plyNumber - 1]?.san ?? '';
    const moveNumber = String(Math.ceil(plyNumber / 2));

    return colorOfPly(plyNumber) === 'white'
        ? `${moveNumber}. ${san}`
        : `${moveNumber}… ${san}`;
}

/** The latest ply already played by one side, or 0 when it has not moved. */
function latestPlyOf(color: 'white' | 'black'): number {
    for (let played = ply.value; played >= 1; played -= 1) {
        if (colorOfPly(played) === color) {
            return played;
        }
    }

    return 0;
}

const opponentNote = computed(() => {
    if (status.value === 'opponent') {
        const verb = ply.value === 0 ? 'moves' : 'replies';

        return `${verb} in ${String(secondsLeft.value)} s`;
    }

    const latest = latestPlyOf(opponentColor.value);

    return latest === 0 ? '' : `played ${numbered(latest)}`;
});

const masterNote = computed(() => {
    const latest = latestPlyOf(props.game.master_color);

    return latest === 0 ? '' : `played ${numbered(latest)}`;
});

/** What the master did, in words: "took on d5", "castled" or "played Nf3". */
function inWords(played: { uci: string; san: string }): string {
    if (isCastling(played.san)) {
        return 'castled';
    }

    return isCapture(played.san)
        ? `took on ${played.uci.slice(2, 4)}`
        : `played ${played.san}`;
}

// Straight after a wrong guess the board goes from the user's move to the
// master's move, more slowly than a normal move so it can be followed.
const animationMs = computed(() =>
    resultIsFresh.value && result.value?.correct === false
        ? CORRECTION_ANIMATION_MS
        : MOVE_ANIMATION_MS,
);

/** The move being asked about or just answered, counting from 1. */
const moveNumber = computed(() =>
    resultIsFresh.value && result.value
        ? result.value.number
        : Math.min(guesses.value.length + 1, props.game.guess_count),
);
</script>

<template>
    <p v-if="notSaved" class="px-5 pb-1 text-caption text-muted" role="status">
        Your progress will not be saved in this browser.
    </p>

    <div
        class="flex items-center justify-between px-5 py-2 text-caption text-muted"
    >
        <span class="flex items-center gap-2">
            <span
                class="player-dot"
                :class="opponentColor"
                aria-hidden="true"
            />
            {{ game.opponent_name }}
        </span>
        <span class="tabular-nums">{{ opponentNote }}</span>
    </div>

    <ChessBoard
        v-model:size="boardSize"
        resizable
        :fen="fen"
        :orientation="game.master_color"
        :last-move="lastMove"
        :movable="status === 'guess'"
        :animation-ms="animationMs"
        @move="guess"
    />

    <!-- Extra room above on larger screens, clear of the resize handle. -->
    <div
        class="flex items-center justify-between px-5 py-2 text-caption sm:pt-4"
    >
        <span class="flex items-center gap-2 font-semibold">
            <span
                class="player-dot"
                :class="game.master_color"
                aria-hidden="true"
            />
            {{ game.master.name }}
        </span>
        <span v-if="status === 'guess'" class="font-semibold text-accent">
            Your guess
        </span>
        <span v-else class="text-muted tabular-nums">{{ masterNote }}</span>
    </div>

    <!-- Screen readers hear each result and each new question. -->
    <!--
        On larger screens the block keeps one height, so the board beside it
        does not change size as the text changes.
    -->
    <section
        class="flex flex-col gap-1.5 px-5 pt-4 pb-6 sm:min-h-48"
        aria-live="polite"
    >
        <template v-if="status === 'over'">
            <p class="label-caps text-muted">Game over</p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ correctCount }} of {{ guesses.length }} correct.
            </h1>
            <p class="text-muted">
                That was every move {{ masterShortName }} played in this game.
            </p>
            <div class="pt-3">
                <AppButton variant="outline" @click="restart">
                    Play it again
                </AppButton>
            </div>
        </template>

        <!-- Straight after a guess, until the opponent has replied. -->
        <template v-else-if="resultIsFresh && result">
            <p
                class="label-caps"
                :class="result.correct ? 'text-accent' : 'text-wrong-text'"
            >
                Move {{ moveNumber }} of {{ game.guess_count }} ·
                {{ result.correct ? 'Correct' : 'Not this time' }}
            </p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ masterShortName }} {{ inWords(result.played) }}.
            </h1>
            <p v-if="result.correct" class="font-semibold text-accent">
                You found the master's move, {{ result.played.san }}.
            </p>
            <p v-else class="text-muted">
                You guessed
                <strong class="font-semibold text-ink">{{
                    result.guessed
                }}</strong
                >. The master played
                <strong class="font-semibold text-ink">{{
                    result.played.san
                }}</strong
                >.
            </p>
        </template>

        <template v-else>
            <p class="label-caps text-muted">
                Move {{ moveNumber }} of {{ game.guess_count }}
            </p>
            <h1 class="font-serif text-heading tracking-heading">
                What did {{ masterShortName }} play?
            </h1>

            <!-- The previous result stays, smaller, until the next guess. -->
            <p v-if="result?.correct" class="text-caption text-accent">
                <span class="font-semibold">Last move: correct.</span>
                You both played {{ result.played.san }}.
            </p>
            <p v-else-if="result" class="text-caption text-muted">
                <span class="font-semibold text-wrong-text">
                    Last move: not this time.
                </span>
                You guessed
                <strong class="font-semibold text-ink">{{
                    result.guessed
                }}</strong
                >, the master played
                <strong class="font-semibold text-ink">{{
                    result.played.san
                }}</strong
                >.
            </p>
            <p v-else class="text-muted">
                Move a piece to make your guess. You get one attempt.
            </p>
        </template>
    </section>

    <BottomBar>
        <div class="flex min-w-0 flex-1 flex-col gap-3">
            <div
                class="flex gap-0.5"
                role="img"
                :aria-label="`${String(correctCount)} of ${String(guesses.length)} guesses correct so far, out of ${String(game.guess_count)} moves`"
            >
                <span
                    v-for="index in game.guess_count"
                    :key="index"
                    class="h-3 min-w-0 flex-1 rounded-tick"
                    :class="
                        guesses[index - 1] === undefined
                            ? 'bg-hairline'
                            : guesses[index - 1]?.correct
                              ? 'bg-accent'
                              : 'bg-wrong'
                    "
                />
            </div>
            <div class="flex items-center justify-between gap-3">
                <p class="flex items-baseline gap-2">
                    <span class="font-serif text-heading tabular-nums">
                        {{ correctCount }} / {{ guesses.length }}
                    </span>
                    <span class="text-caption text-muted">
                        {{ status === 'over' ? 'correct' : 'correct so far' }}
                    </span>
                </p>
                <AppButton variant="outline" @click="delayPanelOpen = true">
                    Reply delay {{ delaySeconds }} s
                </AppButton>
            </div>
        </div>
    </BottomBar>

    <SlideUpPanel v-model:open="delayPanelOpen" title="Reply delay">
        <p class="pt-2 text-muted">
            How long {{ game.opponent_name }} waits before replying.
        </p>
        <div class="pt-3">
            <AppSlider
                v-model="delaySeconds"
                label="Reply delay"
                unit="s"
                unit-name="second"
                :min="REPLY_DELAY_MIN"
                :max="REPLY_DELAY_MAX"
            />
        </div>
        <div class="flex pt-5">
            <AppButton size="large" stretch @click="delayPanelOpen = false">
                Done
            </AppButton>
        </div>
    </SlideUpPanel>
</template>

<style scoped>
/* The small circle beside a player's name: filled for Black, open for White. */
.player-dot {
    box-sizing: border-box;
    flex: none;
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--color-ink);
    border-radius: 50%;
}

.player-dot.black {
    background-color: var(--color-ink);
}

.player-dot.white {
    background-color: var(--color-surface);
}
</style>
