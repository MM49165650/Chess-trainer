// What the settings offer: the board themes, piece sets, marking palettes and
// the sound set, with each one's author and licence. The credits page reads
// the credits from here too, so this is the one list of them.

export type Credit = {
    author: string;
    /** A page about the author, where there is one. */
    authorUrl: string | null;
    licence: string;
    licenceUrl: string;
    /** Where the files were copied from. */
    sourceUrl: string;
};

export type Choice = {
    id: string;
    name: string;
};

export type CreditedChoice = Choice & { credit: Credit };

const LILA = 'https://github.com/lichess-org/lila/tree/master/public';

const BOARD_CREDIT = {
    author: 'The lila authors and pirouetti',
    authorUrl: 'https://lichess.org/@/pirouetti',
    licence: 'AGPL-3.0 or later',
    licenceUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
    sourceUrl: `${LILA}/images/board`,
} as const satisfies Credit;

const GPL_2_OR_LATER = {
    licence: 'GPL-2.0 or later',
    licenceUrl: 'https://www.gnu.org/licenses/gpl-2.0.txt',
} as const;

// Non-commercial and share-alike: the site must stay free, and the files are
// used unchanged.
const CC_BY_NC_SA_4 = {
    licence: 'CC BY-NC-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
} as const;

export const BOARD_THEMES = [
    { id: 'olive', name: 'Olive', credit: BOARD_CREDIT },
    { id: 'brown', name: 'Brown', credit: BOARD_CREDIT },
    { id: 'blue', name: 'Blue', credit: BOARD_CREDIT },
    { id: 'green', name: 'Green', credit: BOARD_CREDIT },
] as const satisfies readonly CreditedChoice[];

export const PIECE_SETS = [
    {
        id: 'maestro',
        name: 'Maestro',
        credit: {
            author: 'sadsnake1',
            authorUrl: null,
            ...CC_BY_NC_SA_4,
            sourceUrl: `${LILA}/piece/maestro`,
        },
    },
    {
        id: 'cburnett',
        name: 'Cburnett',
        credit: {
            author: 'Colin M.L. Burnett',
            authorUrl: 'https://en.wikipedia.org/wiki/User:Cburnett',
            ...GPL_2_OR_LATER,
            sourceUrl: `${LILA}/piece/cburnett`,
        },
    },
    {
        id: 'merida',
        name: 'Merida',
        credit: {
            author: 'Armando Hernandez Marroquin',
            authorUrl: null,
            ...GPL_2_OR_LATER,
            sourceUrl: `${LILA}/piece/merida`,
        },
    },
    {
        id: 'cardinal',
        name: 'Cardinal',
        credit: {
            author: 'sadsnake1',
            authorUrl: null,
            ...CC_BY_NC_SA_4,
            sourceUrl: `${LILA}/piece/cardinal`,
        },
    },
] as const satisfies readonly CreditedChoice[];

/** The marking colours of square control and spot the hanging piece. */
export const MARKING_PALETTES = [
    { id: 'standard', name: 'Standard' },
    { id: 'colour-blind', name: 'Colour-blind friendly' },
] as const satisfies readonly Choice[];

/** The one sound set: Move and Capture only. */
export const SOUND_SET = {
    id: 'sfx',
    name: 'Sfx',
    credit: {
        author: 'Enigmahack',
        authorUrl: 'https://github.com/Enigmahack',
        licence: 'AGPL-3.0 or later',
        licenceUrl: 'https://www.gnu.org/licenses/agpl-3.0.html',
        sourceUrl: `${LILA}/sound/sfx`,
    },
} as const satisfies CreditedChoice;

export type BoardThemeId = (typeof BOARD_THEMES)[number]['id'];
export type PieceSetId = (typeof PIECE_SETS)[number]['id'];
export type MarkingPaletteId = (typeof MARKING_PALETTES)[number]['id'];
