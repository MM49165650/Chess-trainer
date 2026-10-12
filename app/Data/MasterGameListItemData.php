<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One master game as a row of a master's game list. It never carries the
 * game's moves.
 */
final class MasterGameListItemData extends Data
{
    public function __construct(
        public int $id,
        #[LiteralTypeScriptType("'white' | 'black'")]
        public string $master_color,
        public string $opponent_name,
        public ?int $year,
        public ?string $event,
        public int $guess_count,
    ) {}
}
