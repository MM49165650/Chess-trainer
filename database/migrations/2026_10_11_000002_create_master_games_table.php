<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The master games, each filed under its winner: Appendix C of
     * docs/requirements.md.
     *
     * There is no down() method. Rolling back would drop the imported games,
     * and imported content is never deleted.
     */
    public function up(): void
    {
        Schema::create('master_games', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('master_id')->constrained('masters')->restrictOnDelete();
            $table->char('fingerprint', 64)->unique();
            $table->text('master_color');
            $table->text('opponent_name');
            $table->smallInteger('year')->nullable();
            $table->text('event')->nullable();
            $table->smallInteger('ply_count');
            $table->smallInteger('guess_count');
            $table->jsonb('moves');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['master_id', 'year']);
        });

        $checks = [
            // SHA-256 as lowercase hex: Appendix D.
            'master_games_fingerprint_format' => "fingerprint ~ '^[0-9a-f]{64}$'",
            'master_games_master_color_values' => "master_color IN ('white', 'black')",
            'master_games_year_range' => 'year BETWEEN 1800 AND 2100',
            'master_games_ply_count_minimum' => 'ply_count >= 1',
            'master_games_guess_count_range' => 'guess_count BETWEEN 1 AND ply_count',
            // One entry per ply. The contents of an entry are validated by
            // the import, not by the database.
            'master_games_moves_length' => "CASE WHEN jsonb_typeof(moves) = 'array' THEN jsonb_array_length(moves) = ply_count ELSE false END",
        ];

        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE master_games ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }
};
