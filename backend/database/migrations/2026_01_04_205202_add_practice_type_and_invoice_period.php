<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internship', function (Blueprint $table) {
            if (!Schema::hasColumn('internship', 'practice_type')) {
                $table->enum('practice_type', ['standard', 'employment'])
                    ->default('standard')
                    ->after('company_id')
                    ->index('idx_int_practice_type');
            }
        });

        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'invoice_period')) {
                $table->string('invoice_period', 7)->nullable()->after('file_path'); // YYYY-MM
            }
        });
    }

    public function down(): void
    {
        Schema::table('internship', function (Blueprint $table) {
            if (Schema::hasColumn('internship', 'practice_type')) {
                $table->dropColumn('practice_type');
            }
        });

        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'invoice_period')) {
                $table->dropColumn('invoice_period');
            }
        });
    }
};
