// The records kept in the browser: Appendix G of docs/requirements.md.

import type { Phase, PieceType } from '@/chess/conventions';
import type { GameLength } from '@/marking/lengths';

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
    /** 1 to 5. */
    opponentDelaySeconds: number;
    markingPalette: string;
    /** Tactics: whether a solved puzzle moves on to the next by itself. */
    tacticsAutoNext: boolean;
    /** Square control: the length of the next game picked. */
    squareLength: GameLength;
    /** Square control: the full moves skipped at the start, 0 to 10. */
    squareSkipMoves: number;
    /** Spot the hanging piece: the length of the next game picked. */
    hangingLength: GameLength;
    /** Spot the hanging piece: the full moves skipped at the start, 0 to 10. */
    hangingSkipMoves: number;
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

/** The two phases of square control. Hanging pieces are a mode of their own. */
export type SquarePhase = Exclude<Phase, 'hanging'>;

export type SquareSession = {
    gameId: number;
    ply: number;
    /** The next phase to submit. */
    phase: SquarePhase;
    /** True on a castling move while the next phase is one of the rook's. */
    rook: boolean;
    /** How the move's earlier phases scored, in their order. */
    results: boolean[];
    updatedAt: string;
};

export type SquareSeen = {
    gameId: number;
    status: 'finished' | 'abandoned';
    at: string;
};

export type SquareTallies = Record<SquarePhase, Record<PieceType, Tally>>;

/** Spot the hanging piece has one phase per move, so the move is enough. */
export type HangingSession = { gameId: number; ply: number; updatedAt: string };

export type HangingSeen = SquareSeen;

/** One tally for the mode, with no split by piece. */
export type HangingTally = Tally;

export type PuzzleSeen = {
    puzzleId: number;
    piece: PieceType;
    solved: boolean;
    at: string;
};

export type TacticsTallies = Record<PieceType, Tally>;
