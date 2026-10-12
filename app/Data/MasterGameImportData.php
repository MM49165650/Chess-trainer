<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\DataCollectionOf;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\LessThanOrEqualTo;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One master game in the intermediate file that the extract stage writes and
 * the load stage reads: Appendix E of the requirements. The fields are those
 * of the master_games table, with the master's slug in place of its ID.
 */
final class MasterGameImportData extends Data
{
    /**
     * @param  array<int, GameMoveData>  $moves
     */
    public function __construct(
        #[Regex('/^[a-z]+$/')]
        public string $master_slug,
        #[Regex('/^[0-9a-f]{64}$/')]
        public string $fingerprint,
        #[In(['white', 'black'])]
        #[LiteralTypeScriptType("'white' | 'black'")]
        public string $master_color,
        public string $opponent_name,
        #[Between(1800, 2100)]
        public ?int $year,
        public ?string $event,
        #[Min(1)]
        public int $ply_count,
        #[Min(1), LessThanOrEqualTo('ply_count')]
        public int $guess_count,
        #[DataCollectionOf(GameMoveData::class)]
        public array $moves,
        // Last, with a default, because a file extracted before build step
        // 17 does not carry it.
        public ?string $opponent_short_name = null,
    ) {}
}
