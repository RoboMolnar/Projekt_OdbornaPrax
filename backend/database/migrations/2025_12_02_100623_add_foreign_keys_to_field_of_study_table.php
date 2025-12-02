<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('field_of_study', function (Blueprint $table) {
            $table->foreign(['department_id'], 'fk_fos_dept')->references(['department_id'])->on('department')->onUpdate('cascade')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('field_of_study', function (Blueprint $table) {
            $table->dropForeign('fk_fos_dept');
        });
    }
};
