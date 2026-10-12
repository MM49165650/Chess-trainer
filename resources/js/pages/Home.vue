<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import ListMastersController from '@/actions/App/Http/Controllers/Guess/ListMastersController';
</script>

<template>
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
    </main>
</template>
