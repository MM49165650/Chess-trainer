<script setup lang="ts">
// The home page: the four modes, in their order, and a way back into the
// master game played most recently, when one is in progress.

import { Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ShowMasterGameController from '@/actions/App/Http/Controllers/Api/ShowMasterGameController';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import PlayMasterGameController from '@/actions/App/Http/Controllers/Guess/PlayMasterGameController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowAboutController from '@/actions/App/Http/Controllers/ShowAboutController';
import ShowCreditsController from '@/actions/App/Http/Controllers/ShowCreditsController';
import ShowPrivacyController from '@/actions/App/Http/Controllers/ShowPrivacyController';
import ShowProgressController from '@/actions/App/Http/Controllers/ShowProgressController';
import ShowSettingsController from '@/actions/App/Http/Controllers/ShowSettingsController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import PageHead from '@/components/PageHead.vue';
import AppButton from '@/components/ui/AppButton.vue';
import ListRow from '@/components/ui/ListRow.vue';
import type { MasterGameData, PageMetaData } from '@/generated/data';
import { SITE_SHORT_NAME, SOURCE_CODE_URL } from '@/site';
import { readAllMasterGames } from '@/storage/masterGames';
import type { MasterGameRecord } from '@/storage/types';

defineProps<{
    meta: PageMetaData;
}>();

/** The four modes, in the order of the home and progress pages. */
const MODES = [
    {
        name: 'Guess the move',
        description: "Play through a master's win and guess each move.",
        href: ListMastersController.url(),
    },
    {
        name: 'Tactics by piece',
        description:
            'Win material in two moves, sorted by the piece that plays them.',
        href: ListTacticsCategoriesController.url(),
    },
    {
        name: 'Square control',
        description: 'After every move, mark what changed on the board.',
        href: ShowSquaresController.url(),
    },
    {
        name: 'Spot the hanging piece',
        description: 'After every move, find every piece left hanging.',
        href: ShowHangingController.url(),
    },
];

/** The master game in progress that was played most recently, if any. */
const inProgress = ref<MasterGameRecord | null>(null);

/** That game, once it has been fetched. */
const game = ref<MasterGameData | null>(null);
const failure = ref(false);

function familyName(name: string): string {
    return name.split(' ').at(-1) ?? name;
}

/** "Capablanca vs. Marshall, 1918": White first, by family name. */
const gameName = computed(() => {
    if (game.value === null) {
        return '';
    }

    const master = familyName(game.value.master.name);
    const opponent = familyName(game.value.opponent_name);
    const players =
        game.value.master_color === 'white'
            ? `${master} vs. ${opponent}`
            : `${opponent} vs. ${master}`;

    return game.value.year === null
        ? players
        : `${players}, ${String(game.value.year)}`;
});

/** "Move 9 of 36": the guess the game resumes at. */
const moveNote = computed(() => {
    if (game.value === null || inProgress.value === null) {
        return '';
    }

    const guessed = inProgress.value.current?.guesses.length ?? 0;
    const next = Math.min(guessed + 1, game.value.guess_count);

    return `Move ${String(next)} of ${String(game.value.guess_count)}`;
});

const continueUrl = computed(() =>
    inProgress.value === null
        ? ''
        : PlayMasterGameController.url({
              master: inProgress.value.masterSlug,
              game: inProgress.value.gameId,
          }),
);

async function loadGame(): Promise<void> {
    const record = inProgress.value;

    if (record === null) {
        return;
    }

    failure.value = false;

    try {
        const response = await fetch(
            ShowMasterGameController.url(record.gameId),
            {
                headers: { Accept: 'application/json' },
            },
        );

        // A game that is no longer there has nothing to continue.
        if (response.status === 404) {
            inProgress.value = null;

            return;
        }

        if (!response.ok) {
            throw new Error(
                `The game did not load: ${String(response.status)}`,
            );
        }

        game.value = (await response.json()) as MasterGameData;
    } catch {
        failure.value = true;
    }
}

onMounted(async () => {
    const records = await readAllMasterGames();
    let latest: MasterGameRecord | null = null;

    for (const record of records) {
        const at = record.current?.updatedAt;

        if (at !== undefined && at > (latest?.current?.updatedAt ?? '')) {
            latest = record;
        }
    }

    inProgress.value = latest;
    await loadGame();
});
</script>

<template>
    <PageHead :meta="meta" />

    <div class="flex min-h-dvh flex-col sm:mx-auto sm:w-[560px]">
        <header class="flex items-center justify-between pt-2 pr-2 pb-1 pl-5">
            <p class="font-serif text-title italic">{{ SITE_SHORT_NAME }}</p>
            <Link
                :href="ShowSettingsController.url()"
                class="flex size-11 items-center justify-center"
                aria-label="Settings"
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
                >
                    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
                    <circle cx="16" cy="7" r="2" />
                    <circle cx="8" cy="17" r="2" />
                </svg>
            </Link>
        </header>

        <main class="flex flex-col">
            <div class="flex flex-col gap-2.5 px-5 pt-2.5 pb-5">
                <p class="label-caps text-muted">Chess training</p>
                <h1 class="font-serif text-display tracking-heading">
                    Sit beside the masters and guess their next move.
                </h1>
            </div>

            <!-- The master game in progress: loading, failed, or ready. -->
            <section
                v-if="inProgress !== null"
                aria-label="Continue"
                class="border-y border-hairline"
            >
                <Link
                    v-if="game !== null"
                    :href="continueUrl"
                    class="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                    <span class="flex min-w-0 flex-col gap-0.5">
                        <span class="label-caps text-accent">Continue</span>
                        <span class="font-serif text-title">
                            {{ gameName }}
                        </span>
                        <span class="text-caption text-muted tabular-nums">
                            {{ moveNote }}
                        </span>
                    </span>
                    <svg
                        aria-hidden="true"
                        class="flex-none"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </Link>

                <div
                    v-else-if="failure"
                    class="flex flex-col items-start gap-2 px-5 py-3.5"
                    role="alert"
                >
                    <span class="label-caps text-accent">Continue</span>
                    <p class="font-serif text-title">Your game did not load.</p>
                    <p class="text-caption text-muted">
                        Check your connection, then try again.
                    </p>
                    <AppButton variant="outline" @click="loadGame">
                        Try again
                    </AppButton>
                </div>

                <div v-else class="flex flex-col gap-0.5 px-5 py-3.5">
                    <span class="label-caps text-accent">Continue</span>
                    <p class="text-caption text-muted" role="status">
                        Loading your game…
                    </p>
                </div>
            </section>

            <nav aria-label="Modes" class="flex flex-col px-5">
                <ListRow
                    v-for="(mode, index) in MODES"
                    :key="mode.name"
                    :title="mode.name"
                    :description="mode.description"
                    :href="mode.href"
                >
                    <template #leading>
                        {{ String(index + 1).padStart(2, '0') }}
                    </template>
                </ListRow>
            </nav>
        </main>

        <footer
            class="mt-auto flex flex-col items-center px-5 pt-8 pb-2 text-muted"
        >
            <div class="flex gap-7 text-body">
                <Link
                    :href="ShowProgressController.url()"
                    class="flex min-h-11 items-center"
                >
                    Progress
                </Link>
                <Link
                    :href="ShowSettingsController.url()"
                    class="flex min-h-11 items-center"
                >
                    Settings
                </Link>
            </div>
            <div class="flex flex-wrap justify-center gap-x-5 text-caption">
                <Link
                    :href="ShowAboutController.url()"
                    class="flex min-h-11 items-center"
                >
                    About
                </Link>
                <Link
                    :href="ShowCreditsController.url()"
                    class="flex min-h-11 items-center"
                >
                    Credits
                </Link>
                <Link
                    :href="ShowPrivacyController.url()"
                    class="flex min-h-11 items-center"
                >
                    Privacy
                </Link>
                <a :href="SOURCE_CODE_URL" class="flex min-h-11 items-center">
                    Source code
                </a>
            </div>
        </footer>
    </div>
</template>
