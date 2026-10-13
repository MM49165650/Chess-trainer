// A type shared by the answer viewer and its board layer. It lives here
// because the linter cannot read a type exported from a .vue file.

import type { Phase, Square } from '@/chess/conventions';

/** One stored answer of a move, as the answer viewer draws it. */
export type AnswerSet = {
    /** Tells the sets apart and names them, such as "rook lost". */
    key: string;
    /** Drawn on each of its squares, such as L or RL. */
    letters: string;
    /** The phase whose colour it takes. */
    phase: Phase;
    squares: readonly Square[];
};
