<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PracticeStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Optional – ak chceš pri každom seednutí vyčistiť tabuľku
        // DB::table('internship_state')->truncate();

        DB::table('internship_state')->insert([
            ['internship_state_name' => 'V návrhu'],
            ['internship_state_name' => 'Odoslaná na schválenie'],
            ['internship_state_name' => 'Schválená'],
            ['internship_state_name' => 'Prebieha'],
            ['internship_state_name' => 'Ukončená'],
            ['internship_state_name' => 'Zamietnutá'],
            ['internship_state_name' => 'Zrušená'],
        ]);
    }
}
