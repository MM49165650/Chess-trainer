<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * A master game's details without its moves, as a page receives them. The
 * moves come from the data endpoint.
 */
final class MasterGameDetailsData extends Data
{
    public function __construct(
        public int $id,
        public MasterSummaryData $master,
        #[LiteralTypeScriptType("'white' | 'black'")]
        public string $master_color,
        public string $opponent_name,
        public ?int $year,
        public ?string $event,
        public int $ply_count,
        public int $guess_count,
    ) {}
}
