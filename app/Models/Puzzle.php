<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A tactics puzzle, filed under the piece that solves it. Rows are written
 * only by the import:puzzles command, and are never deleted and reloaded.
 */
#[Fillable([
    'lichess_id',
    'fen',
    'setup_move',
    'first_move',
    'reply_move',
    'second_move',
    'piece',
    'rating',
    'popularity',
    'plays',
    'themes',
])]
class Puzzle extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'themes' => 'array',
        ];
    }
}
