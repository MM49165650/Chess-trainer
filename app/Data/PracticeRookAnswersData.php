<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Data;

/**
 * The rook's two answer sets on a castling move, kept apart from the
 * king's: Appendix C of the requirements.
 */
final class PracticeRookAnswersData extends Data
{
    /**
     * @param  array<int, string>  $lost
     * @param  array<int, string>  $controlled
     */
    public function __construct(
        /** Squares the rook no longer controls. */
        public array $lost,
        /** Squares the rook now controls. */
        public array $controlled,
    ) {}

    /**
     * A list may be empty, so both must be there but need not hold
     * anything. Every entry must be a square such as e4.
     *
     * @return array<string, list<string>>
     */
    public static function rules(): array
    {
        $square = ['string', 'regex:/^[a-h][1-8]$/'];

        return [
            'lost' => ['present', 'list'],
            'lost.*' => $square,
            'controlled' => ['present', 'list'],
            'controlled.*' => $square,
        ];
    }
}
