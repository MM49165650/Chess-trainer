<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import ShowProgressController from '@/actions/App/Http/Controllers/ShowProgressController';
import ShowSettingsController from '@/actions/App/Http/Controllers/ShowSettingsController';
import PageHead from '@/components/PageHead.vue';
import type { PageMetaData } from '@/generated/data';
import { SITE_SHORT_NAME } from '@/site';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <PageHead :meta="meta" />

    <header class="flex h-11 items-center px-5 pt-2">
        <h1 class="font-serif text-title-small italic">
            {{ SITE_SHORT_NAME }}
        </h1>
    </header>

    <main class="px-5 pt-4 pb-5">
        <p>A free, open source chess training site. Coming soon.</p>
        <!-- Stands in until the home page is built in step 33. -->
        <p class="mt-2">
            <Link :href="ListMastersController.url()" class="underline">
                Guess the move
            </Link>
        </p>
        <p class="mt-2">
            <Link :href="ShowSquaresController.url()" class="underline">
                Square control
            </Link>
        </p>
        <p class="mt-2">
            <Link :href="ShowHangingController.url()" class="underline">
                Spot the hanging piece
            </Link>
        </p>
        <p class="mt-2">
            <Link
                :href="ListTacticsCategoriesController.url()"
                class="underline"
            >
                Tactics by piece
            </Link>
        </p>
        <p class="mt-2">
            <Link :href="ShowProgressController.url()" class="underline">
                Progress
            </Link>
        </p>
        <p class="mt-2">
            <Link :href="ShowSettingsController.url()" class="underline">
                Settings
            </Link>
        </p>
    </main>
</template>
