<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // document_type_name je UNIQUE
        $types = [
            'EMPLOYMENT_CONTRACT',
            'EMPLOYMENT_INVOICE',
        ];

        foreach ($types as $t) {
            DB::table('document_type')->updateOrInsert(
                ['document_type_name' => $t],
                ['document_type_name' => $t]
            );
        }
    }

    public function down(): void
    {
        DB::table('document_type')
            ->whereIn('document_type_name', ['EMPLOYMENT_CONTRACT', 'EMPLOYMENT_INVOICE'])
            ->delete();
    }
};
