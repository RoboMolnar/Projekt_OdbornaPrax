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
        Schema::table('internship', function (Blueprint $table) {
            $table->foreign(['company_id'], 'fk_int_company')->references(['company_id'])->on('company')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['garant_user_id'], 'fk_int_garant')->references(['user_id'])->on('users')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['state_id'], 'fk_int_state')->references(['internship_state_id'])->on('internship_state')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['student_user_id'], 'fk_int_student')->references(['user_id'])->on('users')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internship', function (Blueprint $table) {
            $table->dropForeign('fk_int_company');
            $table->dropForeign('fk_int_garant');
            $table->dropForeign('fk_int_state');
            $table->dropForeign('fk_int_student');
        });
    }
};
