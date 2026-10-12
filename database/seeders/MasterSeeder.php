<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterSeeder extends Seeder
{
    /**
     * The masters, in display order.
     *
     * @var list<array{slug: string, name: string}>
     */
    private const array MASTERS = [
        ['slug' => 'morphy', 'name' => 'Paul Morphy'],
        ['slug' => 'lasker', 'name' => 'Emanuel Lasker'],
        ['slug' => 'rubinstein', 'name' => 'Akiba Rubinstein'],
        ['slug' => 'capablanca', 'name' => 'José Raúl Capablanca'],
        ['slug' => 'alekhine', 'name' => 'Alexander Alekhine'],
        ['slug' => 'keres', 'name' => 'Paul Keres'],
        ['slug' => 'smyslov', 'name' => 'Vasily Smyslov'],
        ['slug' => 'botvinnik', 'name' => 'Mikhail Botvinnik'],
        ['slug' => 'tal', 'name' => 'Mikhail Tal'],
        ['slug' => 'spassky', 'name' => 'Boris Spassky'],
        ['slug' => 'fischer', 'name' => 'Bobby Fischer'],
    ];

    /**
     * Safe to run again: a master is matched by slug and rewritten in place,
     * so no row is deleted and every ID stays the same.
     */
    public function run(): void
    {
        $rows = [];

        foreach (self::MASTERS as $index => $master) {
            $rows[] = [...$master, 'sort_order' => $index + 1];
        }

        DB::transaction(function () use ($rows): void {
            // The display order is unique and checked one row at a time, so a
            // new master cannot take a number an existing one still holds.
            // Existing numbers are moved out of the way first, below zero.
            DB::table('masters')
                ->where('sort_order', '>', 0)
                ->update(['sort_order' => DB::raw('-sort_order')]);

            DB::table('masters')->upsert($rows, ['slug'], ['name', 'sort_order']);
        });
    }
}
