<?php

declare(strict_types=1);

namespace App\Data;

use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\LiteralTypeScriptType;

/**
 * One puzzle in the intermediate file that the extract stage writes and the
 * load stage reads: Appendix E of the requirements. The fields are those of
 * the puzzles table.
 */
final class PuzzleImportData extends Data
{
    private const string MOVE = '/^[a-h][1-8][a-h][1-8][qrbn]?$/';

    /**
     * @param  array<int, string>  $themes
     */
    public function __construct(
        /** Lichess's own puzzle ID, which is also the fingerprint. */
        #[Regex('/^[A-Za-z0-9]+$/')]
        public string $lichess_id,
        /** The position before the opponent's setup move. */
        public string $fen,
        #[Regex(self::MOVE)]
        public string $setup_move,
        #[Regex(self::MOVE)]
        public string $first_move,
        #[Regex(self::MOVE)]
        public string $reply_move,
        #[Regex(self::MOVE)]
        public string $second_move,
        #[In(['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'])]
        #[LiteralTypeScriptType("'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'")]
        public string $piece,
        #[Between(0, 4000)]
        public int $rating,
        #[Between(-100, 100)]
        public int $popularity,
        #[Min(0)]
        public int $plays,
        /** Lichess's theme labels, exactly as given. */
        public array $themes,
    ) {}
}
