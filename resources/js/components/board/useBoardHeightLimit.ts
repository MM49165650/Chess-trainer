// Keeps a whole screen on show without scrolling: the board inside a
// container may be no taller than the visible screen, less everything else in
// the container. The limit is given to the board as a CSS variable on the
// container, at every screen width.

import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export function useBoardHeightLimit(container: Ref<HTMLElement | null>): void {
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
        let limit = `calc(100dvh - ${String(others)}px)`;

        // The visual viewport is the area really on show. Where a browser
        // reports a taller dynamic height than that, the smaller one counts.
        // The scale undoes a pinch zoom, which must not shrink the board.
        const viewport = window.visualViewport;

        if (viewport) {
            const visible = Math.floor(viewport.height * viewport.scale);

            limit = `min(${limit}, ${String(visible - others)}px)`;
        }

        // Set here and not through the template, so that the board has its
        // new size before the screen is next drawn.
        element.style.setProperty('--board-height-limit', limit);
    }

    onMounted(() => {
        if (container.value === null) {
            return;
        }

        // Any change of state that makes the rest of the screen taller or
        // shorter changes the container's height, and is measured again.
        observer = new ResizeObserver(measure);
        observer.observe(container.value);
        window.visualViewport?.addEventListener('resize', measure);
    });

    onBeforeUnmount(() => {
        observer?.disconnect();
        window.visualViewport?.removeEventListener('resize', measure);
    });
}
