<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A practice game for square control, with the answers for every move. Rows
 * are written only by the import:practice-games command, and are never
 * deleted and reloaded.
 */
#[Fillable([
    'fingerprint',
    'white_rating',
    'black_rating',
    'time_control',
    'ply_count',
    'answers_version',
    'moves',
])]
class PracticeGame extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'moves' => 'array',
        ];
    }
}
