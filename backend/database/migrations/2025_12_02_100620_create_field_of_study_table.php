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
        Schema::create('field_of_study', function (Blueprint $table) {
            $table->integer('field_of_study_id', true);
            $table->string('field_of_study_name', 100)->unique('uk_fos_name');
            $table->integer('department_id')->nullable()->index('idx_fos_dept');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('field_of_study');
    }
};
