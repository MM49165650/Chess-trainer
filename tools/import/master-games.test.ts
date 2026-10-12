// A game on the exclusion list is skipped by the extract and reported under
// its own reason. The games are made up for the test.

import { expect, test } from 'vitest';
import {
    DEFAULT_OPTIONS,
    extractMasterGames,
    fingerprint,
} from './master-games.ts';

const masters = { capablanca: ['Capablanca, Jose Raul'] };

const pgn = (opponent: string, moves: string): string =>
    [
        '[Event "Made up"]',
        '[Site "Nowhere"]',
        '[Date "1920.??.??"]',
        '[White "Capablanca, Jose Raul"]',
        `[Black "${opponent}"]`,
        '[Result "1-0"]',
        '',
        `${moves} 1-0`,
    ].join('\n');

test('a game on the exclusion list is skipped and reported', () => {
    const text = [
        pgn('Example, Ann', '1.e4 e5 2.Nf3 Nc6'),
        pgn('Example, Ben', '1.d4 d5 2.c4 e6'),
    ].join('\n\n');

    const listed = {
        fingerprint: fingerprint('capablanca', 'white', [
            'e2e4',
            'e7e5',
            'g1f3',
            'b8c6',
        ]),
        players: 'Jose Raul Capablanca vs. Ann Example',
        event: 'Made up',
        year: 1920,
        reason: 'Made up for the test.',
    };
    const absent = { ...listed, fingerprint: 'not-in-the-input' };

    const { games, report } = extractMasterGames(
        [text],
        masters,
        DEFAULT_OPTIONS,
        [listed, absent],
    );

    expect(games.map((game) => game.opponent_name)).toEqual(['Ben Example']);
    expect(report.skipped).toEqual({ 'excluded by list': 1 });
    expect(report.excludedByList).toEqual([
        { game: listed, found: true },
        { game: absent, found: false },
    ]);

    // Without the list, both games are kept.
    expect(
        extractMasterGames([text], masters, DEFAULT_OPTIONS).games,
    ).toHaveLength(2);
});
