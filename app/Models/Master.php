<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One of the masters. The rows come from MasterSeeder.
 */
#[Fillable(['slug', 'name', 'sort_order'])]
class Master extends Model
{
    /**
     * The games this master won.
     *
     * @return HasMany<MasterGame, $this>
     */
    public function games(): HasMany
    {
        return $this->hasMany(MasterGame::class);
    }
}
