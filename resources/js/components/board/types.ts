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
