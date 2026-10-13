<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;

/**
 * A practice game as its ID and bare moves, without the answers. The answer
 * viewer searches these for the next special move.
 */
final class PracticeGameMovesData extends Data
{
    /**
     * @param  array<int, GameMoveData>  $moves
     */
    public function __construct(
        public int $id,
        #[DataCollectionOf(GameMoveData::class)]
        public array $moves,
    ) {}
}
