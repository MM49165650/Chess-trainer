<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One piece as a row of the tactics category page.
 */
final class TacticsCategoryData extends Data
{
    public function __construct(
        #[LiteralTypeScriptType("'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'")]
        public string $piece,
        public int $puzzle_count,
    ) {}
}
