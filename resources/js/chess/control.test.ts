// The golden tests: every position in golden-positions.ts, run through the
// calculation. When one fails the code is wrong, not the data.

import { Chess } from 'chess.js';
import { expect, test } from 'vitest';
import { boardFromFen, calculateMove } from './control';
import { parseMove } from './conventions';
import { GOLDEN_POSITIONS } from './golden-positions';

test.each(GOLDEN_POSITIONS)('$name', (golden) => {
    const move = parseMove(golden.move);

    if (move === null) {
        throw new Error(`Not a move: ${golden.move}`);
    }

    // The rules library only replays the move, and throws if it is illegal.
    const chess = new Chess(golden.fen);

    chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion ?? undefined,
    });

    const answers = calculateMove(
        boardFromFen(golden.fen),
        boardFromFen(chess.fen()),
        move,
    );

    expect(answers).toEqual({
        piece: golden.piece,
        lost: golden.lost,
        controlled: golden.controlled,
        hanging: golden.hanging,
    });
});
