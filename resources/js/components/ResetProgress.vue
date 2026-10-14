<script setup lang="ts">
// Reset progress, with a confirmation step in the slide-up panel. The button
// shows only while there is something to clear, stored or counted during the
// visit. It sits on the progress page, and in settings from step 31.

import { onMounted, ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import SlideUpPanel from '@/components/ui/SlideUpPanel.vue';
import { hasProgress, resetProgress } from '@/storage/progress';

const emit = defineEmits<{
    reset: [];
}>();

/** Whether there is anything to clear, or null until the browser has said. */
const clearable = ref<boolean | null>(null);
const panelOpen = ref(false);
const resetting = ref(false);
const done = ref(false);

async function confirm(): Promise<void> {
    resetting.value = true;

    const cleared = await resetProgress();

    resetting.value = false;
    panelOpen.value = false;
    clearable.value = await hasProgress();
    done.value = cleared;

    if (cleared) {
        emit('reset');
    }
}

function open(): void {
    done.value = false;
    panelOpen.value = true;
}

onMounted(async () => {
    clearable.value = await hasProgress();
});
</script>

<template>
    <div>
        <p v-if="done" class="text-muted" role="status">Progress reset.</p>
        <AppButton v-if="clearable === true" variant="outline" @click="open">
            Reset progress
        </AppButton>

        <SlideUpPanel v-model:open="panelOpen" title="Reset all progress?">
            <p class="pt-2 text-muted">
                This clears your scores, history and saved games in every mode,
                in this browser. Your settings stay. This cannot be undone.
            </p>
            <div class="flex gap-2 pt-5">
                <AppButton
                    variant="danger"
                    :disabled="resetting"
                    @click="confirm"
                >
                    Reset progress
                </AppButton>
                <AppButton variant="outline" @click="panelOpen = false">
                    Cancel
                </AppButton>
            </div>
        </SlideUpPanel>
    </div>
</template>
