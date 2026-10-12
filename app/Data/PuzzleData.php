<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One puzzle as the fetch-by-IDs endpoint returns it. The theme labels are
 * left out, because they are not shown anywhere yet.
 */
final class PuzzleData extends Data
{
    public function __construct(
        public int $id,
        /** The position before the opponent's setup move. */
        public string $fen,
        public string $setup_move,
        public string $first_move,
        public string $reply_move,
        public string $second_move,
        #[LiteralTypeScriptType("'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'")]
        public string $piece,
        public int $rating,
    ) {}
}
