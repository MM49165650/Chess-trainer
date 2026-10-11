// Types shared by the board components and the pages that use them. They live
// here because the linter cannot read a type exported from a .vue file.

import type { Square } from '@/chess/conventions';

export type MoveInput = 'tap' | 'drag' | 'both';

/** The result of one submitted phase, as it is drawn on the board. */
export type MarkFeedback = {
    correct: readonly Square[];
    missed: readonly Square[];
    wrong: readonly Square[];
};

// The board's width on larger screens, in pixels. On a phone the board is
// always the full width of the screen.
export const BOARD_SIZE_MIN = 320;
export const BOARD_SIZE_MAX = 720;
export const BOARD_SIZE_DEFAULT = 560;
