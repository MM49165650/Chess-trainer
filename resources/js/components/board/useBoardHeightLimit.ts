// Keeps a whole screen on show without scrolling: the board inside a
// container may be no taller than the window, less everything else in the
// container. The limit is given to the board as a CSS variable, and it only
// has an effect on larger screens, where the board has a size of its own.

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export function useBoardHeightLimit(container: Ref<HTMLElement | null>) {
    /** The tallest the board may be shown, as a CSS length, once measured. */
    const limit = ref<string | null>(null);

    let observer: ResizeObserver | null = null;

    function measure(): void {
        const element = container.value;
        const board = element?.querySelector<HTMLElement>('.chess-board');

        if (!element || !board) {
            return;
        }

        // The container's height without the board is everything else on
        // the screen: it does not change when the board is resized.
        const others = element.offsetHeight - board.offsetHeight;

        limit.value = `${String(window.innerHeight - others)}px`;
    }

    onMounted(() => {
        if (container.value === null) {
            return;
        }

        observer = new ResizeObserver(measure);
        observer.observe(container.value);
        window.addEventListener('resize', measure);
    });

    onBeforeUnmount(() => {
        observer?.disconnect();
        window.removeEventListener('resize', measure);
    });

    return limit;
}
