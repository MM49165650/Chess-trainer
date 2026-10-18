// Opening a practice game by its number, so that a coach can give a student
// a game. A game's number is its ID, which never changes. A game opened this
// way counts like any other, and always starts at move 1: the game length
// and the skipped opening are left out, so everyone given the number sees
// the same game from the same start.

import type { MarkingSession } from '@/storage/marking';
import type { GameListItem } from './choose';
import type { MarkingMode } from './phases';
import { FIRST_PHASE } from './useMarkingGame';

/**
 * The game a typed number names, or null when it names no game in the list.
 * Spaces around the number are ignored; anything but digits names no game.
 */
export function gameNumber(
    games: readonly GameListItem[],
    typed: string,
): number | null {
    const text = typed.trim();

    if (!/^[0-9]{1,18}$/.test(text)) {
        return null;
    }

    const id = Number(text);

    return games.some(([other]) => other === id) ? id : null;
}

export type OpenedGame = {
    /** The session to play: the one in progress, or the game at move 1. */
    session: MarkingSession;
    /** The game in progress that opening this one leaves, or null. */
    abandon: number | null;
};

/**
 * What opening a game by its number does to the mode's session. The game in
 * progress, if it is the same game, simply resumes. Otherwise the game
 * starts at move 1, whether or not it was seen before, and a different game
 * in progress is left as abandoned, as "Next game" does.
 */
export function openByNumber(
    mode: MarkingMode,
    current: MarkingSession | null,
    gameId: number,
): OpenedGame {
    if (current?.gameId === gameId) {
        return { session: current, abandon: null };
    }

    return {
        session: {
            gameId,
            ply: 1,
            phase: FIRST_PHASE[mode],
            rook: false,
            results: [],
        },
        abandon: current?.gameId ?? null,
    };
}
