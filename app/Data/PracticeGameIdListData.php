<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * The IDs of all practice games, as the ID list endpoint returns them:
 * Appendix F of the requirements.
 */
final class PracticeGameIdListData extends Data
{
    /**
     * @param  list<int>  $ids
     */
    public function __construct(
        /** Lowest first, so the list is the same on every request. */
        public array $ids,
    ) {}
}
