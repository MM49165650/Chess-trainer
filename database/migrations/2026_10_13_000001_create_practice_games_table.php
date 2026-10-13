<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The practice games for square control, each with the answers for
     * every move: Appendix C of docs/requirements.md. No username and no
     * Lichess game ID is stored.
     *
     * There is no down() method. Rolling back would drop the imported games,
     * and imported content is never deleted.
     */
    public function up(): void
    {
        Schema::create('practice_games', function (Blueprint $table): void {
            $table->id();
            $table->char('fingerprint', 64)->unique();
            $table->smallInteger('white_rating');
            $table->smallInteger('black_rating');
            $table->text('time_control');
            $table->smallInteger('ply_count');
            $table->smallInteger('answers_version');
            $table->jsonb('moves');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });

        $checks = [
            // SHA-256 as lowercase hex: Appendix D.
            'practice_games_fingerprint_format' => "fingerprint ~ '^[0-9a-f]{64}$'",
            'practice_games_white_rating_range' => 'white_rating BETWEEN 0 AND 4000',
            'practice_games_black_rating_range' => 'black_rating BETWEEN 0 AND 4000',
            'practice_games_ply_count_minimum' => 'ply_count >= 1',
            'practice_games_answers_version_minimum' => 'answers_version >= 1',
            // One entry per ply. The contents of an entry are validated by
            // the import, not by the database.
            'practice_games_moves_length' => "CASE WHEN jsonb_typeof(moves) = 'array' THEN jsonb_array_length(moves) = ply_count ELSE false END",
        ];

        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE practice_games ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }
};
