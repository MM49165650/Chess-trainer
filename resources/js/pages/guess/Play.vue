<script setup lang="ts">
// Guess the move: play through one master game. The page arrives with the
// game's details and fetches its moves from the data endpoint.

import { Head, Link } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import ShowMasterGameController from '@/actions/App/Http/Controllers/Api/ShowMasterGameController';
import GuessGame from '@/components/guess/GuessGame.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { MasterGameData, MasterGameDetailsData } from '@/generated/data';

const props = defineProps<{
    game: MasterGameDetailsData;
}>();

const loaded = ref<MasterGameData | null>(null);
const failed = ref(false);

// White's name first. The master goes by family name, as in the mockups.
const players = computed(() => {
    const master = props.game.master.name.split(' ').at(-1) ?? '';
    const opponent = props.game.opponent_name;

    return props.game.master_color === 'white'
        ? `${master} vs. ${opponent}`
        : `${opponent} vs. ${master}`;
});

const occasion = computed(() =>
    [props.game.event, props.game.year]
        .filter((part) => part !== null)
        .join(', '),
);

async function load(): Promise<void> {
    failed.value = false;

    try {
        const response = await fetch(
            ShowMasterGameController.url(props.game.id),
            {
                headers: { Accept: 'application/json' },
            },
        );

        if (!response.ok) {
            throw new Error(
                `The game did not load: ${String(response.status)}`,
            );
        }

        const body: unknown = await response.json();

        loaded.value = body as MasterGameData;
    } catch {
        failed.value = true;
    }
}

onMounted(load);
</script>

<template>
    <Head
        :title="`Guess the move: ${players}${occasion ? `, ${occasion.replace(', ', ' ')}` : ''}`"
    />

    <main class="sm:mx-auto sm:w-[560px]">
        <header class="flex items-center gap-1 p-1">
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
            <div class="flex min-w-0 flex-1 flex-col items-center text-center">
                <p class="font-serif text-title-small">{{ players }}</p>
                <p v-if="occasion" class="text-label text-muted">
                    {{ occasion }}
                </p>
            </div>
            <!-- Keeps the title centred; the game options will go here. -->
            <span class="size-11 flex-none" aria-hidden="true" />
        </header>

        <GuessGame v-if="loaded" :game="loaded" />

        <div
            v-else-if="failed"
            class="flex flex-col items-start gap-3 px-5 pt-6"
            role="alert"
        >
            <h1 class="font-serif text-heading tracking-heading">
                The game did not load.
            </h1>
            <p class="text-muted">Check your connection, then try again.</p>
            <AppButton @click="load">Try again</AppButton>
        </div>

        <p v-else class="px-5 pt-6 text-muted" role="status">
            Loading the game…
        </p>
    </main>
</template>
