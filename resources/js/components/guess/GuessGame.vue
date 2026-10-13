<script setup lang="ts">
// One master game being guessed: the board, the two players, the prompt or
// the result of the last guess, and the running score in the bottom bar. The
// moves already played can be stepped through, and a finished game shared.

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { colorOfPly } from '@/chess/conventions';
import { isCapture, isCastling } from '@/chess/game';
import ChessBoard from '@/components/board/ChessBoard.vue';
import { useBoardSize } from '@/components/board/useBoardSize';
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
import { shareSummary } from '@/guess/shareSummary';
import { SITE_NAME } from '@/site';
import type { MasterGameRecord } from '@/storage/types';

const props = defineProps<{
    game: MasterGameData;
    /** The game's record from an earlier visit, if there is one. */
    saved: MasterGameRecord | null;
    /** Whether the browser has storage to save progress in. */
    canSave: boolean;
}>();

// Kept in memory only, until the settings arrive.
const delaySeconds = ref(REPLY_DELAY_DEFAULT);

// The size outlasts this game: the next one opens at the same size.
const { boardSize, saveBoardSize } = useBoardSize();
const delayPanelOpen = ref(false);

const {
    ply,
    shownPly,
    viewed,
    shownGuessCount,
    canStepBack,
    canStepForward,
    stepBack,
    stepForward,
    returnToGame,
    viewFromStart,
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

// The latest ply by one side in the position shown, or 0 when it has not
// moved there.
function latestPlyOf(color: 'white' | 'black'): number {
    for (let played = shownPly.value; played >= 1; played -= 1) {
        if (colorOfPly(played) === color) {
            return played;
        }
    }

    return 0;
}

const opponentNote = computed(() => {
    if (status.value === 'opponent' && viewed.value === null) {
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
    viewed.value === null &&
    resultIsFresh.value &&
    result.value?.correct === false
        ? CORRECTION_ANIMATION_MS
        : MOVE_ANIMATION_MS,
);

/**
 * The guess whose outcome is the headline: the one at the earlier move being
 * looked at, or the one just made, until the opponent has replied.
 */
const headline = computed(() => {
    if (viewed.value !== null) {
        return viewed.value.result;
    }

    return status.value !== 'over' && resultIsFresh.value ? result.value : null;
});

/** An earlier move that was not a guess, in words. */
const viewedInWords = computed(() => {
    const move = viewed.value;

    if (!move?.played) {
        return 'The starting position.';
    }

    const mover = move.byMaster
        ? masterShortName.value
        : props.game.opponent_name;

    return `${mover} ${inWords(move.played)}.`;
});

const delayInWords = computed(
    () =>
        `Reply delay, ${String(delaySeconds.value)} second${delaySeconds.value === 1 ? '' : 's'}`,
);

// The left and right arrow keys step through the moves, unless a control
// that uses them itself, such as the delay slider, has the keyboard.
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

/** What happened to the last attempt to share, for the user to read. */
const shareNote = ref('');

// The summary shown for copying by hand, when it could not be sent.
const shareText = ref('');
const sharePanelOpen = ref(false);

function selectAll(event: FocusEvent): void {
    if (event.target instanceof HTMLTextAreaElement) {
        event.target.select();
    }
}

// Through the phone's share sheet where there is one, otherwise onto the
// clipboard, and failing both the text is shown to be copied by hand.
async function share(): Promise<void> {
    const text = shareSummary(
        SITE_NAME,
        props.game,
        guesses.value,
        `${window.location.origin}${window.location.pathname}`,
    );

    shareNote.value = '';

    if ('share' in navigator) {
        try {
            await navigator.share({ text });

            return;
        } catch (error) {
            // The user closed the share sheet without choosing anything.
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
        }
    }

    try {
        await navigator.clipboard.writeText(text);
        shareNote.value = 'Copied. Paste it anywhere to share.';
    } catch {
        shareText.value = text;
        sharePanelOpen.value = true;
    }
}

function playAgain(): void {
    shareNote.value = '';
    restart();
}

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
        class="flex items-center justify-between px-5 py-2 text-caption text-muted short:py-1"
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
        :movable="status === 'guess' && viewed === null"
        :animation-ms="animationMs"
        @move="guess"
        @resized="saveBoardSize"
    />

    <!-- Extra room above on larger screens, clear of the resize handle. -->
    <div
        class="flex items-center justify-between px-5 py-2 text-caption sm:pt-4 short:py-1"
    >
        <span class="flex items-center gap-2 font-semibold">
            <span
                class="player-dot"
                :class="game.master_color"
                aria-hidden="true"
            />
            {{ game.master.name }}
        </span>
        <span
            v-if="status === 'guess' && viewed === null"
            class="font-semibold text-accent"
        >
            Your guess
        </span>
        <span v-else class="text-muted tabular-nums">{{ masterNote }}</span>
    </div>

    <!-- Screen readers hear each result and each new question. -->
    <!--
        The block keeps one height, so the board beside it does not change
        size as the text changes.
    -->
    <section
        class="flex min-h-48 flex-col gap-1.5 px-5 pt-4 pb-6 short:min-h-43 short:pt-2 short:pb-3"
        aria-live="polite"
    >
        <!--
            The outcome of one guess: straight after it is made, until the
            opponent has replied, or when looking back at that move.
        -->
        <template v-if="headline">
            <p
                class="label-caps"
                :class="headline.correct ? 'text-accent' : 'text-wrong-text'"
            >
                Move {{ headline.number }} of {{ game.guess_count }} ·
                {{ headline.correct ? 'Correct' : 'Not this time' }}
            </p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ masterShortName }} {{ inWords(headline.played) }}.
            </h1>
            <p v-if="headline.correct" class="font-semibold text-accent">
                You found the master's move, {{ headline.played.san }}.
            </p>
            <p v-else class="text-muted">
                You guessed
                <strong class="font-semibold text-ink">{{
                    headline.guessed
                }}</strong
                >. The master played
                <strong class="font-semibold text-ink">{{
                    headline.played.san
                }}</strong
                >.
            </p>
        </template>

        <!-- Looking back at a move that was not a guess. -->
        <template v-else-if="viewed">
            <p class="label-caps text-muted">Earlier position</p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ viewedInWords }}
            </h1>
        </template>

        <template v-else-if="status === 'over'">
            <p class="label-caps text-muted">Game over</p>
            <h1 class="font-serif text-heading tracking-heading">
                {{ correctCount }} of {{ guesses.length }} correct.
            </h1>
            <p v-if="shareNote" class="text-muted" role="status">
                {{ shareNote }}
            </p>
            <div class="flex flex-wrap gap-2 pt-3">
                <AppButton @click="share">Share</AppButton>
                <AppButton variant="outline" @click="viewFromStart">
                    Review from the start
                </AppButton>
                <AppButton variant="outline" @click="playAgain">
                    Play it again
                </AppButton>
            </div>
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

        <!-- The way back, whenever an earlier position is on the board. -->
        <div v-if="viewed" class="pt-3">
            <AppButton @click="returnToGame">
                {{
                    status === 'over'
                        ? 'Back to the result'
                        : 'Back to the game'
                }}
            </AppButton>
        </div>
    </section>

    <BottomBar>
        <div class="flex min-w-0 flex-1 flex-col gap-3 short:gap-2">
            <div
                class="flex gap-0.5"
                role="img"
                :aria-label="`${String(correctCount)} of ${String(guesses.length)} guesses correct so far, out of ${String(game.guess_count)} moves`"
            >
                <span
                    v-for="index in game.guess_count"
                    :key="index"
                    class="h-3 min-w-0 flex-1 rounded-tick"
                    :class="[
                        guesses[index - 1] === undefined
                            ? 'bg-hairline'
                            : guesses[index - 1]?.correct
                              ? 'bg-accent'
                              : 'bg-wrong',
                        viewed && shownGuessCount === index
                            ? 'outline-2 outline-offset-1 outline-ink'
                            : '',
                    ]"
                />
            </div>
            <div class="flex items-center justify-between gap-3">
                <p class="flex min-w-0 flex-col">
                    <span class="font-serif text-heading tabular-nums">
                        {{ correctCount }} / {{ guesses.length }}
                    </span>
                    <span class="text-label text-muted">
                        {{ status === 'over' ? 'correct' : 'correct so far' }}
                    </span>
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
                    <AppButton
                        variant="outline"
                        :aria-label="delayInWords"
                        @click="delayPanelOpen = true"
                    >
                        <svg
                            aria-hidden="true"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="8.5" />
                            <path d="M12 7.5V12l3 2" />
                        </svg>
                        <span class="tabular-nums">{{ delaySeconds }} s</span>
                    </AppButton>
                </div>
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

    <!-- Only when neither the share sheet nor the clipboard can be used. -->
    <SlideUpPanel v-model:open="sharePanelOpen" title="Share your result">
        <p class="pt-2 text-muted">
            Sharing is not available here. Copy this text to share it.
        </p>
        <textarea
            class="mt-3 w-full resize-none border border-control-border bg-page p-3 text-caption"
            readonly
            :rows="shareText.split('\n').length"
            aria-label="Your result, to copy"
            :value="shareText"
            @focus="selectAll"
        />
        <div class="flex pt-5">
            <AppButton size="large" stretch @click="sharePanelOpen = false">
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
