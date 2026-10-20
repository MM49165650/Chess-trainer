<script setup lang="ts">
// The home page: the four modes, in their order.

import { Link } from '@inertiajs/vue3';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowAboutController from '@/actions/App/Http/Controllers/ShowAboutController';
import ShowCreditsController from '@/actions/App/Http/Controllers/ShowCreditsController';
import ShowPrivacyController from '@/actions/App/Http/Controllers/ShowPrivacyController';
import ShowProgressController from '@/actions/App/Http/Controllers/ShowProgressController';
import ShowSettingsController from '@/actions/App/Http/Controllers/ShowSettingsController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import PageHead from '@/components/PageHead.vue';
import ListRow from '@/components/ui/ListRow.vue';
import type { PageMetaData } from '@/generated/data';
import { SITE_SHORT_NAME, SOURCE_CODE_URL } from '@/site';

defineProps<{
    meta: PageMetaData;
}>();

/** The four modes, in the order of the home and progress pages. */
const MODES = [
    {
        name: 'Spot the hanging piece',
        description: 'After every move, find every piece left hanging.',
        href: ShowHangingController.url(),
    },
    {
        name: 'Square control',
        description: 'After every move, mark what changed on the board.',
        href: ShowSquaresController.url(),
    },
    {
        name: 'Tactics by piece',
        description: 'Two-move tactics, sorted by the piece that plays them.',
        href: ListTacticsCategoriesController.url(),
    },
    {
        name: 'Guess the move',
        description: "Play through a master's win and guess each move.",
        href: ListMastersController.url(),
    },
];
</script>

<template>
    <PageHead :meta="meta" />

    <div class="flex min-h-dvh flex-col sm:mx-auto sm:w-[560px]">
        <header class="flex items-center justify-between pt-2 pr-2 pb-1 pl-5">
            <h1 class="font-serif text-title italic">{{ SITE_SHORT_NAME }}</h1>
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

        <main class="flex flex-col border-t border-hairline">
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
