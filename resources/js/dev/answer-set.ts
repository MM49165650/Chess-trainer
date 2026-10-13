// What the answer viewer shares outside its page: a type its board layer
// also uses, which the linter cannot read from a .vue file, and a note that
// has to outlive the page.

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

/**
 * Whether a search for a special move is opening the game it found. The
 * page is built again when a game opens, so the note is kept here, and the
 * new page reads it to say what was found.
 */
export const search = { arriving: false };
