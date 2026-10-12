<script setup lang="ts">
// Guess the move: one master's games, a page at a time. The server sends the
// games; the scores and in-progress markers come from the browser's own
// storage. Search, filters and the page number all live in the address.

import { Link, router, usePage } from '@inertiajs/vue3';
import { computed, onMounted, ref, watch } from 'vue';
import ListMasterGamesController from '@/actions/App/Http/Controllers/Guess/ListMasterGamesController';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import PlayMasterGameController from '@/actions/App/Http/Controllers/Guess/PlayMasterGameController';
import RandomMasterGameController from '@/actions/App/Http/Controllers/Guess/RandomMasterGameController';
import PageHead from '@/components/PageHead.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ListRow from '@/components/ui/ListRow.vue';
import SlideUpPanel from '@/components/ui/SlideUpPanel.vue';
import type {
    MasterGameFiltersData,
    MasterGameListItemData,
    MasterSummaryData,
    PageMetaData,
} from '@/generated/data';
import { rememberGameList } from '@/guess/listReturn';
import { readMasterGames } from '@/storage/masterGames';
import type { MasterGameRecord } from '@/storage/types';

type Colour = MasterGameFiltersData['color'];

const COLOURS: readonly { value: Colour; label: string }[] = [
    { value: null, label: 'Either colour' },
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
];

const props = defineProps<{
    meta: PageMetaData;
    master: MasterSummaryData;
    games: MasterGameListItemData[];
    filters: MasterGameFiltersData;
    page: number;
    lastPage: number;
    total: number;
}>();

const inertiaPage = usePage();

/** What the browser holds for the games on this page. */
const records = ref(new Map<number, MasterGameRecord>());

const panelOpen = ref(false);

// What is typed and chosen, before it is applied.
const search = ref('');
const colour = ref<Colour>(null);
const yearFrom = ref('');
const yearTo = ref('');

// The master goes by family name, as on the play screen.
const familyName = computed(
    () => props.master.name.split(' ').at(-1) ?? props.master.name,
);

/** How many of the panel's filters are applied. */
const filterCount = computed(
    () =>
        [
            props.filters.color,
            props.filters.year_from,
            props.filters.year_to,
        ].filter((value) => value !== null).length,
);

const narrowed = computed(
    () => props.filters.q !== null || filterCount.value > 0,
);

const summary = computed(() => {
    const games = props.total === 1 ? '1 game' : `${String(props.total)} games`;

    if (!narrowed.value) {
        return games;
    }

    return props.total === 1 ? `${games} matches` : `${games} match`;
});

function showApplied(): void {
    search.value = props.filters.q ?? '';
    colour.value = props.filters.color;
    yearFrom.value = String(props.filters.year_from ?? '');
    yearTo.value = String(props.filters.year_to ?? '');
}

function listUrl(filters: MasterGameFiltersData, page: number): string {
    return ListMasterGamesController.url(props.master.slug, {
        query: {
            q: filters.q ?? undefined,
            color: filters.color ?? undefined,
            year_from: filters.year_from ?? undefined,
            year_to: filters.year_to ?? undefined,
            page: page > 1 ? page : undefined,
        },
    });
}

// A year that is not four digits is left out, as the server would ignore it.
function year(text: string): number | null {
    return /^[0-9]{4}$/.test(text.trim()) ? Number(text) : null;
}

/** Shows the first page of the list for what is typed and chosen. */
function apply(): void {
    panelOpen.value = false;

    router.visit(
        listUrl(
            {
                q: search.value.trim() || null,
                color: colour.value,
                year_from: year(yearFrom.value),
                year_to: year(yearTo.value),
            },
            1,
        ),
    );
}

function clearFilters(): void {
    colour.value = null;
    yearFrom.value = '';
    yearTo.value = '';
    apply();
}

function clearAll(): void {
    search.value = '';
    clearFilters();
}

function description(game: MasterGameListItemData): string {
    const occasion = [game.event, game.year]
        .filter((part) => part !== null)
        .join(', ');
    const moves =
        game.guess_count === 1 ? '1 move' : `${String(game.guess_count)} moves`;

    return occasion ? `${occasion} · ${moves}` : moves;
}

async function readRecords(): Promise<void> {
    records.value = await readMasterGames(props.games.map((game) => game.id));
}

// Closing the panel without applying puts its choices back as they were.
watch(panelOpen, (open) => {
    if (!open) {
        showApplied();
    }
});

watch(
    () => inertiaPage.url,
    (url) => {
        showApplied();
        rememberGameList(props.master.slug, url);
    },
    { immediate: true },
);

watch(() => props.games, readRecords);
onMounted(readRecords);
</script>

<template>
    <PageHead :meta="meta" />

    <main class="pb-8 sm:mx-auto sm:w-[560px]">
        <header class="flex items-center gap-1 p-1">
            <Link
                :href="ListMastersController.url()"
                class="flex size-11 flex-none items-center justify-center"
                aria-label="Back to the masters"
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
                    <path d="M15 5l-7 7 7 7" />
                </svg>
            </Link>
            <h1 class="min-w-0 flex-1 text-center font-serif text-title-small">
                {{ master.name }}
            </h1>
            <!-- Keeps the title centred. -->
            <span class="size-11 flex-none" aria-hidden="true" />
        </header>

        <form
            class="flex items-center gap-2 px-5 pt-2"
            role="search"
            @submit.prevent="apply"
        >
            <input
                v-model="search"
                type="search"
                class="field min-w-0 flex-1"
                placeholder="Opponent or event"
                aria-label="Search by opponent or event"
                maxlength="100"
                enterkeyhint="search"
            />
            <AppButton
                variant="outline"
                :aria-pressed="filterCount > 0"
                @click="panelOpen = true"
            >
                Filters{{ filterCount > 0 ? ` · ${String(filterCount)}` : '' }}
            </AppButton>
        </form>

        <div
            class="flex min-h-11 items-center justify-between gap-3 px-5 pt-3 pb-2"
        >
            <p class="text-caption text-muted tabular-nums" role="status">
                {{ summary }}
            </p>
            <Link
                v-if="total > 0 || narrowed"
                :href="RandomMasterGameController.url(master.slug)"
                class="flex h-11 items-center text-accent"
            >
                Random game
            </Link>
        </div>

        <nav
            v-if="games.length > 0"
            aria-label="Games"
            class="border-t border-hairline px-5"
        >
            <ListRow
                v-for="game in games"
                :key="game.id"
                :title="game.opponent_name"
                :description="description(game)"
                :href="
                    PlayMasterGameController.url({
                        master: master.slug,
                        game: game.id,
                    })
                "
            >
                <template v-if="records.has(game.id)" #trailing>
                    <span class="flex flex-col items-end gap-1">
                        <span v-if="records.get(game.id)?.finished">
                            {{ records.get(game.id)?.finished?.correct }} /
                            {{ records.get(game.id)?.finished?.total }}
                        </span>
                        <span
                            v-if="records.get(game.id)?.current"
                            class="label-caps text-accent"
                        >
                            In progress
                        </span>
                    </span>
                </template>
            </ListRow>
        </nav>

        <div
            v-else
            class="flex flex-col items-start gap-3 border-t border-hairline px-5 pt-6"
        >
            <template v-if="total > 0">
                <p class="text-muted">
                    There is no page {{ page }}. The list has
                    {{
                        lastPage === 1 ? '1 page' : `${String(lastPage)} pages`
                    }}.
                </p>
                <Link :href="listUrl(filters, 1)" class="text-accent underline">
                    Go to the first page
                </Link>
            </template>
            <template v-else-if="narrowed">
                <p class="text-muted">No games match.</p>
                <AppButton variant="outline" @click="clearAll">
                    Show all games
                </AppButton>
            </template>
            <p v-else class="text-muted">No games by {{ familyName }} yet.</p>
        </div>

        <nav
            v-if="games.length > 0 && lastPage > 1"
            aria-label="Pages"
            class="flex items-center justify-between gap-3 px-5 pt-5"
        >
            <Link
                v-if="page > 1"
                :href="listUrl(filters, page - 1)"
                class="page-link"
                rel="prev"
            >
                Previous
            </Link>
            <span v-else class="page-link" aria-hidden="true" />
            <p class="text-caption text-muted tabular-nums">
                Page {{ page }} of {{ lastPage }}
            </p>
            <Link
                v-if="page < lastPage"
                :href="listUrl(filters, page + 1)"
                class="page-link"
                rel="next"
            >
                Next
            </Link>
            <span v-else class="page-link" aria-hidden="true" />
        </nav>

        <SlideUpPanel v-model:open="panelOpen" title="Filters">
            <form @submit.prevent="apply">
                <p class="pt-3 label-caps text-muted">
                    {{ familyName }} played
                </p>
                <div class="flex flex-wrap gap-2 pt-2">
                    <AppButton
                        v-for="option in COLOURS"
                        :key="option.label"
                        variant="outline"
                        :aria-pressed="colour === option.value"
                        @click="colour = option.value"
                    >
                        {{ option.label }}
                    </AppButton>
                </div>

                <p class="pt-5 label-caps text-muted">Years</p>
                <div class="flex items-center gap-3 pt-2">
                    <input
                        v-model="yearFrom"
                        class="field w-24"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="From"
                        aria-label="From year"
                    />
                    <span class="text-muted" aria-hidden="true">to</span>
                    <input
                        v-model="yearTo"
                        class="field w-24"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="To"
                        aria-label="To year"
                    />
                </div>

                <div class="flex items-center gap-3 pt-6">
                    <AppButton
                        variant="quiet"
                        size="large"
                        @click="clearFilters"
                    >
                        Clear
                    </AppButton>
                    <AppButton type="submit" size="large" stretch>
                        Show games
                    </AppButton>
                </div>
            </form>
        </SlideUpPanel>
    </main>
</template>

<style scoped>
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

.page-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 96px;
    height: 44px;
    border-radius: var(--radius-pill);
}

a.page-link {
    border: 1px solid var(--color-control-border);
}

a.page-link:focus-visible {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
}
</style>
