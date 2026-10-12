<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * One master as a row of the masters page.
 */
final class MasterListItemData extends Data
{
    public function __construct(
        public string $slug,
        public string $name,
        public int $game_count,
    ) {}
}
