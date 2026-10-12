<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * The search and filters a game list was made with. A value that was missing
 * or not valid is null, and was not applied.
 */
final class MasterGameFiltersData extends Data
{
    public function __construct(
        public ?string $q,
        #[LiteralTypeScriptType("'white' | 'black' | null")]
        public ?string $color,
        public ?int $year_from,
        public ?int $year_to,
    ) {}
}
