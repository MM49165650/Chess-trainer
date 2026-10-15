<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * Every practice game, as the ID list endpoint returns it: Appendix F of
 * the requirements.
 */
final class PracticeGameIdListData extends Data
{
    /**
     * @param  list<array{int, int}>  $items
     */
    public function __construct(
        /**
         * Pairs of game ID and length in plies, lowest ID first, so the list
         * is the same on every request. The length lets the browser pick a
         * game of the length chosen.
         */
        #[LiteralTypeScriptType('[id: number, plies: number][]')]
        public array $items,
    ) {}
}
