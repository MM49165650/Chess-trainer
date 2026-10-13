<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Data;

/**
 * One practice game with its moves and their answers, as a page receives
 * it: the fields of Appendix C of the requirements, without the fingerprint.
 */
final class PracticeGameData extends Data
{
    /**
     * @param  array<int, PracticeMoveData>  $moves
     */
    public function __construct(
        public int $id,
        public int $white_rating,
        public int $black_rating,
        public string $time_control,
        public int $ply_count,
        public int $answers_version,
        #[DataCollectionOf(PracticeMoveData::class)]
        public array $moves,
    ) {}
}
