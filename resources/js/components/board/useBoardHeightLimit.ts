// Keeps a whole screen on show without scrolling: the board inside a
// container may be no taller than the visible screen, less everything else in
// the container. The limit is given to the board as a CSS variable, at every
// screen width.

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
        const others = Math.ceil(
            element.getBoundingClientRect().height -
                board.getBoundingClientRect().height,
        );

        // The dynamic viewport height is what is on show at this moment, so
        // the browser keeps the fit as a phone's address bar comes and goes.
        limit.value = `calc(100dvh - ${String(others)}px)`;
    }

    onMounted(() => {
        if (container.value === null) {
            return;
        }

        observer = new ResizeObserver(measure);
        observer.observe(container.value);
    });

    onBeforeUnmount(() => {
        observer?.disconnect();
    });

    return limit;
}
