<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;

/**
 * The puzzles asked for by ID, as the fetch-by-IDs endpoint returns them:
 * Appendix F of the requirements.
 */
final class PuzzleListData extends Data
{
    /**
     * @param  array<int, PuzzleData>  $items
     */
    public function __construct(
        /** In the order the IDs were asked for. */
        #[DataCollectionOf(PuzzleData::class)]
        public array $items,
    ) {}
}
