// The records kept in the browser: Appendix G of docs/requirements.md.

import type { Phase, PieceType } from '@/chess/conventions';

export type Tally = { attempts: number; correct: number };

export type Guess = { uci: string; correct: boolean };

export type Meta = { schemaVersion: number; firstUsedAt: string };

export type Settings = {
    appearance: 'light' | 'dark' | 'system';
    boardTheme: string;
    pieceSet: string;
    /** Larger screens only; null means the 560 default. */
    boardSizePx: number | null;
    sound: boolean;
    moveInput: 'tap' | 'drag' | 'both';
    /** 1 to 10. */
    opponentDelaySeconds: number;
    markingPalette: string;
};

export type MasterGameRecord = {
    gameId: number;
    masterSlug: string;
    /** The last completed attempt. */
    finished: {
        correct: number;
        total: number;
        guesses: Guess[];
        finishedAt: string;
    } | null;
    /** The attempt in progress. */
    current: { guesses: Guess[]; startedAt: string; updatedAt: string } | null;
};

export type SquareSession = {
    gameId: number;
    ply: number;
    phase: Phase;
    updatedAt: string;
};

export type SquareSeen = {
    gameId: number;
    status: 'finished' | 'abandoned';
    at: string;
};

export type SquareTallies = Record<Phase, Record<PieceType, Tally>>;

export type PuzzleSeen = {
    puzzleId: number;
    piece: PieceType;
    solved: boolean;
    at: string;
};

export type TacticsTallies = Record<PieceType, Tally>;
