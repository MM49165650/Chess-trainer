<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One entry of a practice game's moves list, with its three answer sets:
 * Appendix C of the requirements.
 */
final class PracticeMoveData extends Data
{
    /**
     * @param  array<int, string>  $lost
     * @param  array<int, string>  $controlled
     * @param  array<int, string>  $hanging
     */
    public function __construct(
        /** From-square, to-square, then a promotion letter if any. */
        #[Regex('/^[a-h][1-8][a-h][1-8][qrbn]?$/')]
        public string $uci,
        /** Standard notation, for display only. */
        public string $san,
        /** The type of the moving piece before the move; the king for castling. */
        #[In(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'])]
        #[LiteralTypeScriptType("'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'")]
        public string $piece,
        /** Squares the moved piece no longer controls. */
        public array $lost,
        /** Squares the moved piece now controls. */
        public array $controlled,
        /** Every hanging piece and pawn after the move, of both sides. */
        public array $hanging,
    ) {}

    /**
     * An answer set may be empty, so the three lists must be there but need
     * not hold anything. Every entry must be a square such as e4.
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
            'hanging' => ['present', 'list'],
            'hanging.*' => $square,
        ];
    }
}
