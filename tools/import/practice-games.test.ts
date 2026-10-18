// The rules of the practice game extract, on made-up games: each rule that
// skips a game, the family cap, the length bands, and the same choice on
// every run.

import { expect, test } from 'vitest';
import {
    DEFAULT_OPTIONS,
    createPracticeExtract,
    readGames,
    type PracticeOptions,
    type SourceGame,
} from './practice-games.ts';

const OPENERS = ['a3', 'b3', 'c3', 'd3', 'e3', 'g3', 'h3', 'a4', 'b4', 'c4'];
const SHUFFLE = ['Nf3', 'Ng8', 'Ng1', 'Nf6'];

/**
 * A legal made-up game of the given length: a pawn move that tells the
 * games apart, then the knights going out and back.
 */
function moveText(opener: number, plies: number): string {
    const moves = [OPENERS[opener] ?? 'a3', 'Nf6'];

    while (moves.length < plies) {
        moves.push(SHUFFLE[(moves.length - 2) % SHUFFLE.length] ?? '');
    }

    // Written as Lichess writes it, with a clock comment after every move.
    return (
        moves
            .slice(0, plies)
            .map((move, index) =>
                index % 2 === 0
                    ? `${String(index / 2 + 1)}. ${move} { [%clk 0:10:00] }`
                    : `${String((index + 1) / 2)}... ${move}?! { [%clk 0:10:00] }`,
            )
            .join(' ') + ' 1-0'
    );
}

function game(
    opener: number,
    plies: number,
    tags: Record<string, string> = {},
): SourceGame {
    return {
        tags: {
            Event: 'Rated Rapid game',
            Site: 'https://lichess.org/madeupid',
            White: 'ann_example',
            Black: 'ben_example',
            Result: '1-0',
            WhiteElo: '1100',
            BlackElo: '1150',
            Opening: `Family ${String(opener)}: Some Line`,
            TimeControl: '600+0',
            Termination: 'Normal',
            ...tags,
        },
        moveText: moveText(opener, plies),
    };
}

function extract(games: SourceGame[], options: Partial<PracticeOptions> = {}) {
    const run = createPracticeExtract({ ...DEFAULT_OPTIONS, ...options });

    for (const one of games) {
        run.add(one);
    }

    return run.finish();
}

test('each rule skips its game and reports it, and no name is written', () => {
    const { games, report } = extract([
        game(0, 30),
        game(1, 30, { WhiteElo: '?' }),
        game(2, 30, { Termination: 'Abandoned' }),
        game(3, 30, { Termination: 'Rules infraction' }),
        game(4, 30, { TimeControl: '600+5' }),
        game(5, 30, { BlackElo: '1200' }),
        game(6, 30, { WhiteTitle: 'BOT' }),
        game(7, 29),
        game(8, 121),
        // The knight cannot go back to g1 twice in a row.
        {
            ...game(9, 30),
            moveText: `${moveText(9, 30).slice(0, -4)} 16. Ng1 1-0`,
        },
        game(9, 120, { BlackTitle: 'FM' }),
    ]);

    expect(report.read).toBe(11);
    expect(report.skipped).toEqual({
        'a rating is missing': 1,
        'abandoned or a rules infraction': 2,
        'not the --time-control': 1,
        'a player not under --max-rating': 1,
        'a bot player': 1,
        'below --min-plies': 1,
        'above --max-plies': 1,
        'illegal move or unreadable moves': 1,
    });
    expect(games.map((one) => one.ply_count).sort()).toEqual([120, 30]);

    const written = JSON.stringify(games);

    expect(written).not.toContain('ann_example');
    expect(written).not.toContain('ben_example');
    expect(written).not.toContain('lichess.org');

    // The answers of Appendix B come with every move.
    const first = games.find((one) => one.ply_count === 30);

    expect(first?.moves[0]).toEqual({
        uci: 'a2a3',
        san: 'a3',
        piece: 'pawn',
        lost: ['b3'],
        controlled: ['b4'],
        rook: null,
        hanging: [],
    });
    expect(first).toMatchObject({
        white_rating: 1100,
        black_rating: 1150,
        time_control: '600+0',
        answers_version: 6,
    });
});

test('no family passes its cap and each band takes its share', () => {
    const family = { Opening: 'One Family: Line' };
    const { games, report } = extract(
        [
            // Four short games of one family, then others of each length.
            game(0, 30, family),
            game(1, 32, family),
            game(2, 34, family),
            game(3, 36, family),
            game(4, 40),
            game(5, 49),
            game(6, 50),
            game(7, 73),
            game(8, 74),
            game(9, 120),
            game(0, 60),
            game(1, 62),
            game(2, 64),
        ],
        { limit: 8, perFamily: 2 },
    );

    expect(report.byBand).toEqual({
        short: { chosen: 3, share: 3 },
        medium: { chosen: 3, share: 3 },
        long: { chosen: 2, share: 2 },
    });
    expect(games).toHaveLength(8);
    expect(report.byFamily['One Family']).toBeLessThanOrEqual(2);
    expect(Math.max(...Object.values(report.byFamily))).toBeLessThanOrEqual(2);
    expect(report.skipped['passed the rules but not chosen']).toBe(5);
});

test('the same games are chosen in the same order on every run', () => {
    const games = OPENERS.flatMap((_, opener) => [
        game(opener, 30 + opener),
        game(opener, 50 + opener),
        game(opener, 80 + opener),
    ]);
    const options = { limit: 9, perFamily: 2 };
    const first = extract(games, options).games;
    const again = extract([...games].reverse(), options).games;

    expect(first).toHaveLength(9);
    expect(again.map((one) => one.fingerprint)).toEqual(
        first.map((one) => one.fingerprint),
    );
});

test('a file is read one game at a time, without a game cut off at its end', async () => {
    const text = [
        '[Event "Rated Rapid game"]',
        '[WhiteElo "1100"]',
        '',
        '1. e4 e5 1-0',
        '',
        '[Event "Rated Rapid game"]',
        '[WhiteElo "900"]',
        '',
        '1. d4 d5 2. c4',
    ];
    const read: SourceGame[] = [];

    for await (const one of readGames(text)) {
        read.push(one);
    }

    expect(read).toEqual([
        {
            tags: { Event: 'Rated Rapid game', WhiteElo: '1100' },
            moveText: '1. e4 e5 1-0',
        },
    ]);
});
