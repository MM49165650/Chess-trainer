<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A master game, filed under its winner. Rows are written only by the
 * import:master-games command, and are never deleted and reloaded.
 */
#[Fillable([
    'master_id',
    'fingerprint',
    'master_color',
    'opponent_name',
    'opponent_short_name',
    'year',
    'event',
    'ply_count',
    'guess_count',
    'moves',
])]
class MasterGame extends Model
{
    /**
     * The winner, under whom the game is filed.
     *
     * @return BelongsTo<Master, $this>
     */
    public function master(): BelongsTo
    {
        return $this->belongsTo(Master::class);
    }

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
