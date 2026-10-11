<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One master game with its details and moves, as the data endpoint returns
 * it: Appendix F of the requirements.
 */
final class MasterGameData extends Data
{
    /**
     * @param  array<int, GameMoveData>  $moves
     */
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
        #[DataCollectionOf(GameMoveData::class)]
        public array $moves,
    ) {}
}
