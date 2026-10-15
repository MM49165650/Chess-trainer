// Picking the next game of a marking mode and making it the mode's session.
// The play page picks when there is no session and on "Next game", and the
// landing page when "Start a new game" is pressed. Both follow the mode's
// choices of game length and skipped opening as they stand at the pick.

import ListPracticeGameIdsController from '@/actions/App/Http/Controllers/Api/ListPracticeGameIdsController';
import type { PracticeGameIdListData } from '@/generated/data';
import { loadSettings, useSettings } from '@/settings/useSettings';
import {
    clearSeenGames,
    readSeenGames,
    saveSession,
    type MarkingSession,
} from '@/storage/marking';
import { CHOICES_OF, chooseGame, type GameListItem } from './choose';
import type { MarkingMode } from './phases';
import { pointAfterOpening } from './useMarkingGame';

/** The list of practice games, fetched once per visit. */
let list: GameListItem[] | null = null;

/**
 * Every practice game, as pairs of ID and length in plies. A request that
 * fails is tried again on the next call.
 */
export async function practiceGames(): Promise<readonly GameListItem[]> {
    if (list === null) {
        const response = await fetch(ListPracticeGameIdsController.url(), {
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            throw new Error(
                `The game list did not load: ${String(response.status)}`,
            );
        }

        list = ((await response.json()) as PracticeGameIdListData).items;
    }

    return list;
}

/** Takes a game that turned out not to exist out of the list. */
export function forgetGame(id: number): void {
    list = (list ?? []).filter(([other]) => other !== id);
}

/**
 * Picks a game of the mode's chosen length that the mode has not seen,
 * never one of `avoid`, and saves it as the session: at move 1, or at the
 * first move after the skipped opening. The moves skipped are never marked,
 * so they count towards nothing. When every game of the length has
 * been seen, their seen records are cleared first. The answer is the new
 * session, or null when there is no game of that length.
 */
export async function pickGame(
    mode: MarkingMode,
    avoid: readonly number[],
): Promise<MarkingSession | null> {
    await loadSettings();

    const settings = useSettings();
    const games = await practiceGames();
    const choice = chooseGame(
        games,
        settings[CHOICES_OF[mode].length],
        new Set(await readSeenGames(mode)),
        avoid,
    );

    if (choice.reset.length > 0) {
        await clearSeenGames(mode, choice.reset);
    }

    const plies = games.find(([id]) => id === choice.id)?.[1];

    if (choice.id === null || plies === undefined) {
        return null;
    }

    const session: MarkingSession = {
        gameId: choice.id,
        ...pointAfterOpening(plies, mode, settings[CHOICES_OF[mode].skipMoves]),
        results: [],
    };

    await saveSession(mode, session);

    return session;
}
