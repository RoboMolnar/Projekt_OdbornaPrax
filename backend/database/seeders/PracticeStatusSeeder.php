<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PracticeStatusSeeder extends Seeder
{
    public function run(): void
    {
        $table = 'internship_state';

        $hasCreatedAt = Schema::hasColumn($table, 'created_at');
        $hasUpdatedAt = Schema::hasColumn($table, 'updated_at');
        $now = now();

        $states = [
            'Vytvorená',
            'Potvrdená',
            'Zamietnutá',   // zamietne firma
            'Schválená',
            'Neschválená',  // neschváli garant
            'Obhájená',
            'Neobhájená',
        ];

        foreach ($states as $name) {
            $payload = ['internship_state_name' => $name];

            if ($hasCreatedAt) $payload['created_at'] = $now;
            if ($hasUpdatedAt) $payload['updated_at'] = $now;

            DB::table($table)->updateOrInsert(
                ['internship_state_name' => $name],
                $payload
            );
        }
    }
}
