// The user's settings. Only the settings that have been chosen are stored; a
// setting that is missing takes its default, from the one list below.

import { GAME_LENGTHS, SKIP_MOVES_MAX } from '@/marking/lengths';
import {
    BOARD_THEMES,
    MARKING_PALETTES,
    PIECE_SETS,
} from '@/settings/catalogue';
import { database } from './db';
import type { Settings } from './types';

/** Every setting's default. Nothing else in the code sets one. */
export const DEFAULT_SETTINGS: Readonly<Settings> = {
    appearance: 'system',
    boardTheme: 'olive',
    pieceSet: 'maestro',
    boardSizePx: null,
    sound: false,
    moveInput: 'both',
    opponentDelaySeconds: 3,
    markingPalette: 'standard',
    tacticsAutoNext: false,
    squareLength: 'any',
    squareSkipMoves: 0,
    hangingLength: 'any',
    hangingSkipMoves: 0,
};

/** The opponent move delay in guess the move, in whole seconds. */
export const OPPONENT_DELAY_MIN = 1;
export const OPPONENT_DELAY_MAX = 5;

/** A whole number from `min` to `max`, or the fallback. */
function wholeNumber(
    value: unknown,
    min: number,
    max: number,
    fallback: number,
): number {
    return typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= min &&
        value <= max
        ? value
        : fallback;
}

function oneOf<T>(value: unknown, choices: readonly T[], fallback: T): T {
    return choices.find((choice) => choice === value) ?? fallback;
}

function ids(list: readonly { id: string }[]): string[] {
    return list.map((choice) => choice.id);
}

/**
 * The settings in full: each saved value that is still a valid choice, and
 * the default for the rest. A board, piece set or palette that is no longer
 * offered falls back to the default.
 */
export function withDefaults(saved: Partial<Settings>): Settings {
    const d = DEFAULT_SETTINGS;
    const size = saved.boardSizePx;

    return {
        appearance: oneOf(
            saved.appearance,
            ['light', 'dark', 'system'] as const,
            d.appearance,
        ),
        boardTheme: oneOf(saved.boardTheme, ids(BOARD_THEMES), d.boardTheme),
        pieceSet: oneOf(saved.pieceSet, ids(PIECE_SETS), d.pieceSet),
        boardSizePx: typeof size === 'number' ? size : d.boardSizePx,
        sound: typeof saved.sound === 'boolean' ? saved.sound : d.sound,
        moveInput: oneOf(
            saved.moveInput,
            ['tap', 'drag', 'both'] as const,
            d.moveInput,
        ),
        opponentDelaySeconds: wholeNumber(
            saved.opponentDelaySeconds,
            OPPONENT_DELAY_MIN,
            OPPONENT_DELAY_MAX,
            d.opponentDelaySeconds,
        ),
        markingPalette: oneOf(
            saved.markingPalette,
            ids(MARKING_PALETTES),
            d.markingPalette,
        ),
        tacticsAutoNext:
            typeof saved.tacticsAutoNext === 'boolean'
                ? saved.tacticsAutoNext
                : d.tacticsAutoNext,
        squareLength: oneOf(saved.squareLength, GAME_LENGTHS, d.squareLength),
        squareSkipMoves: wholeNumber(
            saved.squareSkipMoves,
            0,
            SKIP_MOVES_MAX,
            d.squareSkipMoves,
        ),
        hangingLength: oneOf(
            saved.hangingLength,
            GAME_LENGTHS,
            d.hangingLength,
        ),
        hangingSkipMoves: wholeNumber(
            saved.hangingSkipMoves,
            0,
            SKIP_MOVES_MAX,
            d.hangingSkipMoves,
        ),
    };
}

/** The settings in full. Without storage they are all the defaults. */
export async function readSettings(): Promise<Settings> {
    try {
        const db = await database();

        return withDefaults((await db?.get('settings', 'settings')) ?? {});
    } catch {
        return withDefaults({});
    }
}

/**
 * Saves some settings and leaves the others as they were. The answer is
 * whether they were saved.
 */
export async function saveSettings(
    changes: Partial<Settings>,
): Promise<boolean> {
    try {
        const db = await database();

        if (db === null) {
            return false;
        }

        const transaction = db.transaction('settings', 'readwrite');
        const saved = (await transaction.store.get('settings')) ?? {};

        await transaction.store.put({ ...saved, ...changes }, 'settings');
        await transaction.done;

        return true;
    } catch {
        return false;
    }
}
