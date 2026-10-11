<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Data;

/**
 * One entry of a master game's moves list: Appendix C of the requirements.
 */
final class GameMoveData extends Data
{
    public function __construct(
        /** From-square, to-square, then a promotion letter if any. */
        #[Regex('/^[a-h][1-8][a-h][1-8][qrbn]?$/')]
        public string $uci,
        /** Standard notation, for display only. */
        public string $san,
    ) {}
}
