<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The seven masters: Appendix C of docs/requirements.md.
     *
     * There is no down() method. Rolling back would drop a content table,
     * and imported content is never deleted.
     */
    public function up(): void
    {
        Schema::create('masters', function (Blueprint $table): void {
            $table->id();
            $table->text('slug')->unique();
            $table->text('name');
            $table->smallInteger('sort_order')->unique();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });

        // The slug is used in URLs: lowercase letters only.
        DB::statement(<<<'SQL'
            ALTER TABLE masters
            ADD CONSTRAINT masters_slug_format CHECK (slug ~ '^[a-z]+$')
            SQL);
    }
};
