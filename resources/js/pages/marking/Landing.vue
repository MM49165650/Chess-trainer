<script setup lang="ts">
// The landing page of a marking mode, square control or spot the hanging
// piece: what the mode is, and a button that opens the exercise. It reads
// Resume while the mode has a session to go back to, and Start otherwise.
// The percentages come in build step 28.

import { Link, router } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import PlayHangingController from '@/actions/App/Http/Controllers/Hanging/PlayHangingController';
import PlaySquaresController from '@/actions/App/Http/Controllers/Squares/PlaySquaresController';
import PageHead from '@/components/PageHead.vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { PageMetaData } from '@/generated/data';
import type { MarkingMode } from '@/marking/phases';
import { storageAvailable } from '@/storage/db';
import { readSession } from '@/storage/marking';

const props = defineProps<{
    mode: MarkingMode;
    meta: PageMetaData;
}>();

/** Whether the mode has a session, or null until the browser has said. */
const resumable = ref<boolean | null>(null);
const canSave = ref(true);

const playUrl = computed(() =>
    props.mode === 'squares'
        ? PlaySquaresController.url()
        : PlayHangingController.url(),
);

function play(): void {
    router.visit(playUrl.value);
}

onMounted(async () => {
    canSave.value = await storageAvailable();
    resumable.value = (await readSession(props.mode)) !== null;
});
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

        <div class="flex flex-col items-start gap-2 px-5 pt-2">
            <h1 class="font-serif text-display tracking-heading">
                {{ meta.heading }}
            </h1>
            <p class="text-muted">{{ meta.description }}</p>
            <p v-if="!canSave" class="text-caption text-muted" role="status">
                Your progress will not be saved in this browser.
            </p>
            <!-- Hidden until the browser has said which it is, so the label
                 never changes under the user's thumb. -->
            <AppButton
                size="large"
                class="mt-4"
                :class="{ invisible: resumable === null }"
                @click="play"
            >
                {{ resumable === true ? 'Resume' : 'Start' }}
            </AppButton>
        </div>
    </main>
</template>
