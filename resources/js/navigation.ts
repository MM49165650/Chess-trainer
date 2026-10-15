// The play screens' back arrow returns to the page the user came from, the
// same as the browser's own back button, as long as that page is on this
// site. When there is none, because the screen was opened from a shared
// link, a bookmark or a fresh launch of the installed app, it goes to the
// screen's parent page instead, in place of the screen in the history, so
// the browser's back button does not return to it either.
//
// To know whether the page behind is on this site, the pages this tab has
// shown since the site was loaded are kept here, in history order. A reload
// starts afresh, so after one the arrow goes to the parent page.

import { router } from '@inertiajs/vue3';

/** The addresses of the pages in this tab's history, oldest first. */
let pages: string[] = [];

/** Where the current page is in that list. */
let at = 0;

/** Starts keeping the list. Called once, before the first page is shown. */
export function trackHistory(): void {
    router.on('navigate', (event) => {
        const { page, type } = event.detail;

        if (type === 'initial') {
            pages = [page.url];
            at = 0;
        } else if (type === 'visit') {
            pages = [...pages.slice(0, at + 1), page.url];
            at = pages.length - 1;
        } else if (pages[at - 1] === page.url) {
            // Back. Where back and forward lead to the same address, back is
            // taken: guessing wrong that way only means the arrow goes to
            // the parent page, never off the site.
            at -= 1;
        } else if (pages[at + 1] === page.url) {
            at += 1;
        } else {
            pages = [page.url];
            at = 0;
        }
    });
}

/**
 * Goes back to the page the user came from, if it is on this site, and
 * otherwise to the given parent page.
 */
export function goBack(parentUrl: string): void {
    if (at > 0) {
        window.history.back();

        return;
    }

    // The parent page takes the screen's place, in the history and here.
    pages[at] = parentUrl;
    router.visit(parentUrl, { replace: true });
}
