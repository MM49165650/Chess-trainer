<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * Every puzzle in one category, as the ID list endpoint returns it:
 * Appendix F of the requirements.
 */
final class PuzzleIdListData extends Data
{
    /**
     * @param  list<array{int, int}>  $items
     */
    public function __construct(
        #[LiteralTypeScriptType("'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'")]
        public string $piece,
        /** Pairs of puzzle ID and rating, easiest first. */
        #[LiteralTypeScriptType('[id: number, rating: number][]')]
        public array $items,
    ) {}
}
