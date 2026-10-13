<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;

/**
 * One practice game as the data endpoint returns it: Appendix F of the
 * requirements. It carries only what the square-control screen uses, so the
 * ratings, the time control and the fingerprint are left out.
 */
final class PracticeGamePlayData extends Data
{
    /**
     * @param  array<int, PracticeMoveData>  $moves
     */
    public function __construct(
        public int $id,
        public int $ply_count,
        public int $answers_version,
        #[DataCollectionOf(PracticeMoveData::class)]
        public array $moves,
    ) {}
}
