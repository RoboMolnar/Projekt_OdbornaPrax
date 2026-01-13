<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ExternalSystemSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->updateOrInsert(
            [
                // fixné ID, aby sa na to dalo odkazovať v config/.env
                'user_id' => 200,
            ],
            [
                'role'                 => 'external',
                'first_name'           => 'Externý',
                'last_name'            => 'Systém',
                'email'                => 'external_system@test.sk',
                'phone_number'         => null,
                'password'             => Hash::make('heslo123'),
                'active'               => 1,
                'must_change_password' => 0,
                'created_at'           => now(),
                'updated_at'           => now(),
            ]
        );
    }
}
