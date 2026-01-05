<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $table = 'document_type';

        $hasCreatedAt = Schema::hasColumn($table, 'created_at');
        $hasUpdatedAt = Schema::hasColumn($table, 'updated_at');

        $now = now();

        $rows = [
            1 => 'EMPLOYMENT_CONTRACT',
            2 => 'EMPLOYMENT_INVOICE',
            3 => 'PRACTICE_CONTRACT',
            4 => 'PRACTICE_REPORT',
        ];

        foreach ($rows as $id => $name) {
            $payload = [
                'document_type_name' => $name,
            ];

            if ($hasCreatedAt) $payload['created_at'] = $now;
            if ($hasUpdatedAt) $payload['updated_at'] = $now;

            DB::table($table)->updateOrInsert(
                ['document_type_id' => $id],
                $payload
            );
        }
    }
}
