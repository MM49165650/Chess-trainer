// Where the play screen's back arrow goes. A game list notes its own address,
// with its page, search and filters, each time it is shown; a game opened
// from it goes back there. Nothing is noted when a game is opened directly,
// so the arrow then goes to the master's list.

let left: { masterSlug: string; url: string } | null = null;

/** Notes the address of the game list the user is looking at. */
export function rememberGameList(masterSlug: string, url: string): void {
    left = { masterSlug, url };
}

/** The list the user came from, if it was this master's. */
export function gameListLeft(masterSlug: string): string | null {
    return left?.masterSlug === masterSlug ? left.url : null;
}
