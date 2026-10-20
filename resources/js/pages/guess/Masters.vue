<script setup lang="ts">
// Guess the move: the Continue card for the game in progress, if there is
// one, then the masters, in their fixed order. Each row opens that
// master's game list.

import { Link } from '@inertiajs/vue3';
import { ref } from 'vue';
import ListMasterGamesController from '@/actions/App/Http/Controllers/Guess/ListMasterGamesController';
import ContinueCard from '@/components/guess/ContinueCard.vue';
import PageHead from '@/components/PageHead.vue';
import ListRow from '@/components/ui/ListRow.vue';
import type { MasterListItemData, PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
    masters: MasterListItemData[];
}>();

/** Whether the browser has said if a game is in progress. */
const read = ref(false);

function gameCount(count: number): string {
    return count === 1 ? '1 game' : `${String(count)} games`;
}
</script>

<template>
    <PageHead :meta="meta" />

    <main class="pb-8 sm:mx-auto sm:w-[560px]">
        <header class="flex items-center p-1">
            <Link
                href="/"
                class="flex size-11 flex-none items-center justify-center"
                aria-label="Back to home"
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
        </header>

        <div class="flex flex-col gap-2 px-5 pt-2 pb-4">
            <p class="label-caps text-muted">Guess the move</p>
            <h1 class="font-serif text-display tracking-heading">
                Choose a master.
            </h1>
        </div>

        <ContinueCard class="border-t border-hairline" @read="read = true" />

        <!-- Hidden until read, so the list does not move as the page opens. -->
        <nav
            aria-label="Masters"
            class="border-t border-hairline px-5"
            :class="{ invisible: !read }"
        >
            <ListRow
                v-for="master in masters"
                :key="master.slug"
                :title="master.name"
                :href="ListMasterGamesController.url(master.slug)"
            >
                <template #trailing>
                    {{ gameCount(master.game_count) }}
                </template>
            </ListRow>
        </nav>
    </main>
</template>
