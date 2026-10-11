<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * One of the seven masters. The rows come from MasterSeeder.
 */
#[Fillable(['slug', 'name', 'sort_order'])]
class Master extends Model {}
