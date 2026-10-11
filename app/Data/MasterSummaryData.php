<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * The master a game is filed under, as it appears inside a master game.
 */
final class MasterSummaryData extends Data
{
    public function __construct(
        public string $slug,
        public string $name,
    ) {}
}
