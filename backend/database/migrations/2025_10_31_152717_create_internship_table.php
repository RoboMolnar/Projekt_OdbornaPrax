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
        Schema::create('internship', function (Blueprint $table) {
            $table->integer('internship_id', true);
            $table->integer('student_user_id')->index('idx_int_student');
            $table->integer('company_id')->index('idx_int_company');
            $table->integer('garant_user_id')->index('idx_int_garant');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('year');
            $table->enum('semester', ['1', '2']);
            $table->integer('worked_hours')->nullable();
            $table->string('grade', 10)->nullable();
            $table->integer('state_id')->default(1)->index('idx_int_state');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internship');
    }
};
