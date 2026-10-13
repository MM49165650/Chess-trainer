<script setup lang="ts">
// A development-only page for checking the stored answers of practice games
// by eye: build step 25. It steps through a game and shows, for each move,
// the stored answers on the board and as lists. It is not part of the site.

import { Head, router } from '@inertiajs/vue3';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
    PROMOTION_PIECES,
    colorOfPly,
    parseMove,
    type Phase,
    type Square,
} from '@/chess/conventions';
import {
    isCastling,
    positionsOf,
    specialMoveOf,
    type SpecialMove,
} from '@/chess/game';
import ChessBoard from '@/components/board/ChessBoard.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { PracticeGameData, PracticeGameMovesData } from '@/generated/data';
import AnswerLayer from './AnswerLayer.vue';
import { search, type AnswerSet } from './answer-set';

const props = defineProps<{
    game: PracticeGameData | null;
    previousId: number | null;
    nextId: number | null;
}>();

type Wanted = 'any' | SpecialMove;

const WANTED: readonly Wanted[] = [
    'any',
    'castling',
    'promotion',
    'en passant',
];

const ply = ref(1);
/** The one answer drawn on the board, by its key, or all of them. */
const shown = ref('all');
const before = ref(false);
const wanted = ref<Wanted>('any');
const goTo = ref('');
/** What the last search for a special move found, in words. */
const found = ref('');
const searching = ref(false);

const moves = computed(() => props.game?.moves ?? []);

// Entry 0 is the starting position and entry n the position after n plies.
const positions = computed(() => positionsOf(moves.value));

/** The kind of each move of a game, with null for an ordinary move. */
function specialsOf(
    game: readonly { uci: string; san: string }[],
    fens: readonly string[] = positionsOf(game),
): (SpecialMove | null)[] {
    return game.map((move, index) => specialMoveOf(fens[index] ?? '', move));
}

const specials = computed(() => specialsOf(moves.value, positions.value));

const move = computed(() => moves.value[ply.value - 1] ?? null);
const parts = computed(() =>
    move.value === null ? null : parseMove(move.value.uci),
);
const special = computed(() => specials.value[ply.value - 1] ?? null);

const fen = computed(
    () => positions.value[before.value ? ply.value - 1 : ply.value] ?? '',
);

/**
 * The stored answers of the move, in the order of its phases: three for an
 * ordinary move, and five for castling, where the king and the rook are
 * marked apart.
 */
const answers = computed<AnswerSet[]>(() => {
    const stored = move.value;

    if (stored === null) {
        return [];
    }

    const set = (
        key: string,
        letters: string,
        phase: Phase,
        squares: readonly string[],
    ): AnswerSet => ({ key, letters, phase, squares: squares as Square[] });

    const hanging = set('hanging', 'H', 'hanging', stored.hanging);

    return stored.rook === null
        ? [
              set('lost', 'L', 'lost', stored.lost),
              set('controlled', 'C', 'controlled', stored.controlled),
              hanging,
          ]
        : [
              set('king lost', 'KL', 'lost', stored.lost),
              set('king controlled', 'KC', 'controlled', stored.controlled),
              set('rook lost', 'RL', 'lost', stored.rook.lost),
              set(
                  'rook controlled',
                  'RC',
                  'controlled',
                  stored.rook.controlled,
              ),
              hanging,
          ];
});

// A move without the answer that was picked goes back to showing them all.
watch(answers, (sets) => {
    if (!sets.some((set) => set.key === shown.value)) {
        shown.value = 'all';
    }
});

/**
 * The answers drawn on the board. On the position before the move only the
 * lost squares are drawn: the others belong to the position after it.
 */
const drawn = computed(() =>
    answers.value.filter((set) =>
        before.value
            ? set.phase === 'lost'
            : shown.value === 'all' || shown.value === set.key,
    ),
);

/** The move as it is written in a game score, such as 19... Nxe5. */
const written = computed(() => {
    if (move.value === null) {
        return '';
    }

    const number = String(Math.ceil(ply.value / 2));

    return `${number}${ply.value % 2 === 1 ? '.' : '...'} ${move.value.san}`;
});

/** The move in words, such as "White knight, f3 to e5". */
const inWords = computed(() => {
    if (move.value === null || parts.value === null) {
        return '';
    }

    const side = colorOfPly(ply.value) === 'white' ? 'White' : 'Black';
    const { from, to, promotion } = parts.value;

    if (isCastling(move.value.san)) {
        const kingside = to.startsWith('g');
        const rank = to.charAt(1);

        return (
            `${side} castles ${kingside ? 'kingside' : 'queenside'}: ` +
            `king ${from} to ${to}, rook ` +
            (kingside ? `h${rank} to f${rank}` : `a${rank} to d${rank}`)
        );
    }

    return (
        `${side} ${move.value.piece}, ${from} to ${to}` +
        (special.value === 'en passant' ? ', capturing en passant' : '') +
        (promotion === null
            ? ''
            : `, promoting to a ${PROMOTION_PIECES[promotion]}`)
    );
});

/** A name with its first letter as a capital, such as "Rook lost". */
function label(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function setPly(next: number): void {
    ply.value = Math.min(Math.max(next, 1), Math.max(moves.value.length, 1));
}

function step(by: number): void {
    setPly(ply.value + by);
    found.value = '';
}

function openGame(id: number | null): void {
    if (id !== null) {
        router.visit(`/dev/answers/${String(id)}`);
    }
}

function openTyped(): void {
    const id = Number(goTo.value);

    if (Number.isInteger(id) && id > 0) {
        goTo.value = '';
        openGame(id);
    }
}

/** The first move of the wanted kind at or after an index, as its ply. */
function firstWanted(
    kinds: readonly (SpecialMove | null)[],
    from: number,
): number | null {
    const index = kinds.findIndex(
        (kind, at) =>
            at >= from &&
            kind !== null &&
            (wanted.value === 'any' || kind === wanted.value),
    );

    return index === -1 ? null : index + 1;
}

function sayFound(): void {
    found.value = `Found: ${special.value ?? 'no special move'}, in game ${String(props.game?.id ?? '')} at move ${String(ply.value)}.`;
}

/**
 * Jumps to the next special move after the current one. When this game has
 * none left, the following games are searched, a batch at a time, and the
 * first one that has such a move is opened at it.
 */
async function findSpecial(): Promise<void> {
    const here = firstWanted(specials.value, ply.value);
    const what = wanted.value === 'any' ? 'special move' : wanted.value;

    if (here !== null) {
        setPly(here);
        before.value = false;
        sayFound();

        return;
    }

    searching.value = true;

    try {
        let after = props.game?.id ?? 0;

        for (;;) {
            found.value = `Searching the games after ${String(after)} for the next ${what}…`;

            const response = await fetch(
                `/dev/answers/following/${String(after)}`,
            );
            const games = (await response.json()) as PracticeGameMovesData[];

            if (games.length === 0) {
                found.value = `No ${what} in the rest of the games.`;

                return;
            }

            for (const game of games) {
                const at = firstWanted(specialsOf(game.moves), 0);

                if (at !== null) {
                    // The message is set once the game has opened. It is
                    // kept out of the address so a reload does not repeat it.
                    search.arriving = true;
                    router.visit(
                        `/dev/answers/${String(game.id)}?ply=${String(at)}`,
                    );

                    return;
                }

                after = game.id;
            }
        }
    } finally {
        searching.value = false;
    }
}

// A new game starts at the move named in the address, or at move 1.
watch(
    () => props.game?.id,
    () => {
        const query = new URLSearchParams(window.location.search);

        before.value = false;
        setPly(Number(query.get('ply')) || 1);

        // A search that ended in this game says what it found.
        if (search.arriving) {
            search.arriving = false;
            sayFound();
        } else {
            found.value = '';
        }
    },
    { immediate: true },
);

// The move is kept in the address, so a reload lands on the same one.
watch([ply, () => props.game?.id], () => {
    if (props.game !== null) {
        window.history.replaceState(
            window.history.state,
            '',
            `/dev/answers/${String(props.game.id)}?ply=${String(ply.value)}`,
        );
    }
});

function onKey(event: KeyboardEvent): void {
    // The arrows belong to a field while something is being typed in it.
    if (event.target instanceof HTMLInputElement) {
        return;
    }

    if (event.key === 'ArrowLeft') {
        step(-1);
    } else if (event.key === 'ArrowRight') {
        step(1);
    }
}

onMounted(() => {
    window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
});
</script>

<template>
    <Head title="Answer viewer" />

    <main class="pb-16 sm:mx-auto sm:w-[560px] lg:w-[1000px]">
        <h1 class="px-5 py-4 font-serif text-heading tracking-heading">
            Answer viewer
        </h1>

        <p v-if="game === null" class="px-5">
            No practice games are loaded. Run the import first.
        </p>

        <div v-else class="lg:flex lg:items-start lg:gap-8">
            <div class="lg:w-[560px] lg:flex-none">
                <ChessBoard :fen="fen" :last-move="parts" :animation-ms="0">
                    <template #overlay>
                        <AnswerLayer orientation="white" :sets="drawn" />
                    </template>
                </ChessBoard>

                <div class="flex items-center gap-2 px-5 pt-4 lg:px-0">
                    <AppButton
                        variant="outline"
                        aria-label="Previous move"
                        :disabled="ply <= 1"
                        @click="step(-1)"
                    >
                        ←
                    </AppButton>
                    <p class="flex-1 text-center tabular-nums">
                        Move {{ ply }} of {{ moves.length }}
                    </p>
                    <AppButton
                        variant="outline"
                        aria-label="Next move"
                        :disabled="ply >= moves.length"
                        @click="step(1)"
                    >
                        →
                    </AppButton>
                </div>

                <div class="flex flex-wrap gap-2 px-5 pt-4 lg:px-0">
                    <AppButton
                        v-for="key in ['all', ...answers.map((set) => set.key)]"
                        :key="key"
                        data-switch
                        variant="outline"
                        :aria-pressed="!before && shown === key"
                        :disabled="before"
                        @click="shown = key"
                    >
                        {{ label(key) }}
                    </AppButton>
                </div>

                <div class="px-5 pt-4 lg:px-0">
                    <AppButton
                        variant="outline"
                        :aria-pressed="before"
                        @click="before = !before"
                    >
                        Before the move: {{ before ? 'on' : 'off' }}
                    </AppButton>
                    <p v-if="before" class="pt-2 text-muted">
                        Showing lost squares on the position before the move.
                    </p>
                </div>
            </div>

            <div class="min-w-0 lg:flex-1">
                <section class="section">
                    <h2 class="font-serif text-title">Move</h2>
                    <p class="pt-2 text-title-small tabular-nums">
                        {{ written }}
                    </p>
                    <p class="pt-1">{{ inWords }}</p>
                    <dl class="facts">
                        <dt>Stored piece</dt>
                        <dd>{{ move?.piece }}</dd>
                        <dt>Stored move</dt>
                        <dd class="tabular-nums">{{ move?.uci }}</dd>
                        <dt>Special move</dt>
                        <dd>{{ special ?? 'no' }}</dd>
                    </dl>
                </section>

                <section class="section">
                    <h2 class="font-serif text-title">Stored answers</h2>
                    <div v-for="set in answers" :key="set.key" class="pt-3">
                        <h3 class="flex items-center gap-2 font-medium">
                            <span class="swatch" :class="set.phase">
                                {{ set.letters }}
                            </span>
                            {{ label(set.key) }}
                            <span class="text-muted tabular-nums">
                                ({{ set.squares.length }})
                            </span>
                        </h3>
                        <p class="pt-1 tabular-nums" :data-list="set.key">
                            {{ set.squares.join(', ') || 'none' }}
                        </p>
                    </div>
                </section>

                <section class="section">
                    <h2 class="font-serif text-title">Game</h2>
                    <dl class="facts">
                        <dt>ID</dt>
                        <dd class="tabular-nums">{{ game.id }}</dd>
                        <dt>Ratings</dt>
                        <dd class="tabular-nums">
                            White {{ game.white_rating }}, Black
                            {{ game.black_rating }}
                        </dd>
                        <dt>Time control</dt>
                        <dd class="tabular-nums">{{ game.time_control }}</dd>
                        <dt>Answers version</dt>
                        <dd class="tabular-nums">
                            {{ game.answers_version }}
                        </dd>
                    </dl>

                    <div class="flex flex-wrap gap-2 pt-4">
                        <AppButton
                            variant="outline"
                            :disabled="previousId === null"
                            @click="openGame(previousId)"
                        >
                            Previous game
                        </AppButton>
                        <AppButton
                            variant="outline"
                            :disabled="nextId === null"
                            @click="openGame(nextId)"
                        >
                            Next game
                        </AppButton>
                        <AppButton
                            variant="outline"
                            @click="router.visit('/dev/answers/random')"
                        >
                            Random game
                        </AppButton>
                    </div>

                    <form class="flex gap-2 pt-3" @submit.prevent="openTyped">
                        <input
                            v-model="goTo"
                            class="field w-32"
                            inputmode="numeric"
                            maxlength="18"
                            placeholder="Game ID"
                            aria-label="Game ID"
                        />
                        <AppButton variant="outline" type="submit">
                            Open
                        </AppButton>
                    </form>
                </section>

                <section class="section">
                    <h2 class="font-serif text-title">Special moves</h2>
                    <div class="flex flex-wrap gap-2 pt-3">
                        <AppButton
                            v-for="kind in WANTED"
                            :key="kind"
                            variant="outline"
                            :aria-pressed="wanted === kind"
                            @click="wanted = kind"
                        >
                            {{ kind }}
                        </AppButton>
                    </div>
                    <div class="pt-3">
                        <AppButton :disabled="searching" @click="findSpecial">
                            Next special move
                        </AppButton>
                    </div>
                    <p class="pt-2" aria-live="polite" data-found>
                        {{ found }}
                    </p>
                </section>
            </div>
        </div>
    </main>
</template>

<style scoped>
.section {
    margin-top: 24px;
    padding: 16px 20px 0;
    border-top: 1px solid var(--color-hairline);
}

@media (min-width: 1024px) {
    .section {
        padding-inline: 0;
    }

    .section:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: 0;
    }
}

.facts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 16px;
    padding-top: 8px;
}

.facts dt {
    color: var(--color-muted);
}

/* The phase colours fail as text, so the letter sits on a dark shade. */
.swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    padding: 0 4px;
    height: 20px;
    color: var(--color-board-mark-label);
    font-size: var(--text-caption);
    font-weight: 700;
}

.swatch.lost {
    background-color: var(--color-board-mark-lost-border);
}

.swatch.controlled {
    background-color: var(--color-board-mark-controlled-border);
}

.swatch.hanging {
    background-color: var(--color-board-mark-hanging-border);
}

/* The size keeps a phone from zooming in when the field is tapped. */
.field {
    height: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius-pill);
    background-color: transparent;
    color: var(--color-ink);
    font-size: var(--text-button);
}

.field::placeholder {
    color: var(--color-muted);
}

.field:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
