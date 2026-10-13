<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Data;

/**
 * One practice game in the intermediate file that the extract stage writes
 * and the load stage reads: Appendix E of the requirements. The fields are
 * those of the practice_games table. There is no player name and no game
 * link among them.
 */
final class PracticeGameImportData extends Data
{
    /**
     * @param  array<int, PracticeMoveData>  $moves
     */
    public function __construct(
        #[Regex('/^[0-9a-f]{64}$/')]
        public string $fingerprint,
        #[Between(0, 4000)]
        public int $white_rating,
        #[Between(0, 4000)]
        public int $black_rating,
        /** As given by Lichess, for example 600+0. */
        public string $time_control,
        #[Min(1)]
        public int $ply_count,
        /** The version of the calculation that produced the answers. */
        #[Min(1)]
        public int $answers_version,
        #[DataCollectionOf(PracticeMoveData::class)]
        public array $moves,
    ) {}
}
