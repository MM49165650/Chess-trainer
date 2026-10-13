// The spoiler-free summary of a finished game that the user can share:
// Appendix H of docs/requirements.md. It never contains moves.

import type { MasterGameDetailsData } from '@/generated/data';
import type { Guess } from '@/storage/types';

const CORRECT_SQUARE = '🟩';
const WRONG_SQUARE = '⬜';
const SQUARES_PER_LINE = 10;

export function shareSummary(
    siteName: string,
    game: Pick<
        MasterGameDetailsData,
        'master' | 'master_color' | 'opponent_name' | 'year'
    >,
    guesses: readonly Guess[],
    link: string,
): string {
    const [white, black] =
        game.master_color === 'white'
            ? [game.master.name, game.opponent_name]
            : [game.opponent_name, game.master.name];
    const year = game.year === null ? '' : `, ${String(game.year)}`;
    const correct = guesses.filter((guess) => guess.correct).length;
    const squares: string[] = [];

    for (let start = 0; start < guesses.length; start += SQUARES_PER_LINE) {
        squares.push(
            guesses
                .slice(start, start + SQUARES_PER_LINE)
                .map((guess) => (guess.correct ? CORRECT_SQUARE : WRONG_SQUARE))
                .join(''),
        );
    }

    return [
        `${siteName} · Guess the move`,
        `${white} vs. ${black}${year}`,
        `${String(correct)}/${String(guesses.length)}`,
        ...squares,
        link,
    ].join('\n');
}
