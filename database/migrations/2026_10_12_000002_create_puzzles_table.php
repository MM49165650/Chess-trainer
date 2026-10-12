<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The tactics puzzles, each filed under the piece that solves it:
     * Appendix C of docs/requirements.md.
     *
     * There is no down() method. Rolling back would drop the imported
     * puzzles, and imported content is never deleted.
     */
    public function up(): void
    {
        Schema::create('puzzles', function (Blueprint $table): void {
            $table->id();
            // Lichess's own puzzle ID, which is also the fingerprint.
            $table->text('lichess_id')->unique();
            $table->text('fen');
            $table->text('setup_move');
            $table->text('first_move');
            $table->text('reply_move');
            $table->text('second_move');
            $table->text('piece');
            $table->smallInteger('rating');
            $table->smallInteger('popularity');
            $table->integer('plays');
            // Lichess's theme labels, stored but not shown anywhere yet.
            $table->jsonb('themes');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->index('piece');
        });

        $checks = [
            'puzzles_piece_values' => "piece IN ('pawn', 'knight', 'bishop', 'rook', 'queen', 'king')",
            'puzzles_rating_range' => 'rating BETWEEN 0 AND 4000',
            'puzzles_popularity_range' => 'popularity BETWEEN -100 AND 100',
            'puzzles_plays_minimum' => 'plays >= 0',
            'puzzles_themes_list' => "jsonb_typeof(themes) = 'array'",
        ];

        foreach ($checks as $name => $condition) {
            DB::statement("ALTER TABLE puzzles ADD CONSTRAINT {$name} CHECK ({$condition})");
        }
    }
};
