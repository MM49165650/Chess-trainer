<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The opponent's family name, for titles and the play screen header:
     * Appendix C of docs/requirements.md. Where it is null, the full name is
     * shown.
     *
     * There is no down() method, as for every content table.
     */
    public function up(): void
    {
        Schema::table('master_games', function (Blueprint $table): void {
            $table->text('opponent_short_name')->nullable();
        });
    }
};
