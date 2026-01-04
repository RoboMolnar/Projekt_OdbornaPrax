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
            ['internship_state_name' => 'Vytvorená'],
            ['internship_state_name' => 'Potvrdená'],
            ['internship_state_name' => 'Zamietnutá'],   // zamietne firma
            ['internship_state_name' => 'Schválená'],
            ['internship_state_name' => 'Neschválená'],  // neschváli garant
            ['internship_state_name' => 'Obhájená'],
            ['internship_state_name' => 'Neobhájená'],
        ]);
    }
}
