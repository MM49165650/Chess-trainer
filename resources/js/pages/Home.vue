<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
import ShowHangingController from '@/actions/App/Http/Controllers/Hanging/ShowHangingController';
import ShowSquaresController from '@/actions/App/Http/Controllers/Squares/ShowSquaresController';
import ListTacticsCategoriesController from '@/actions/App/Http/Controllers/Tactics/ListTacticsCategoriesController';
import PageHead from '@/components/PageHead.vue';
import type { PageMetaData } from '@/generated/data';

defineProps<{
    meta: PageMetaData;
}>();
</script>

<template>
    <PageHead :meta="meta" />

    <main class="p-5">
        <h1 class="text-2xl font-semibold">{{ $page.props.name }}</h1>
        <p class="mt-2">
            A free, open source chess training site. Coming soon.
        </p>
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
    </main>
</template>
