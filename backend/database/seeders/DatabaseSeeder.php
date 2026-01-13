<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PracticeStatusSeeder::class,
            GarantSeeder::class,
            DocumentTypeSeeder::class,
            ExternalSystemSeeder::class,
        ]);
    }
}
