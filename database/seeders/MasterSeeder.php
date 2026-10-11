<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterSeeder extends Seeder
{
    /**
     * The seven masters, in display order.
     *
     * @var list<array{slug: string, name: string}>
     */
    private const array MASTERS = [
        ['slug' => 'morphy', 'name' => 'Paul Morphy'],
        ['slug' => 'capablanca', 'name' => 'José Raúl Capablanca'],
        ['slug' => 'alekhine', 'name' => 'Alexander Alekhine'],
        ['slug' => 'botvinnik', 'name' => 'Mikhail Botvinnik'],
        ['slug' => 'tal', 'name' => 'Mikhail Tal'],
        ['slug' => 'fischer', 'name' => 'Bobby Fischer'],
        ['slug' => 'spassky', 'name' => 'Boris Spassky'],
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

        DB::table('masters')->upsert($rows, ['slug'], ['name', 'sort_order']);
    }
}
