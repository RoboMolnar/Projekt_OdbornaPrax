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
        Schema::table('users', function (Blueprint $table) {
            $table->foreign(['address_id'], 'fk_users_address')->references(['address_id'])->on('address')->onUpdate('cascade')->onDelete('set null');
            $table->foreign(['company_id'], 'fk_users_company')->references(['company_id'])->on('company')->onUpdate('cascade')->onDelete('set null');
            $table->foreign(['department_id'], 'fk_users_department')->references(['department_id'])->on('department')->onUpdate('cascade')->onDelete('set null');
            $table->foreign(['field_of_study_id'], 'fk_users_fos')->references(['field_of_study_id'])->on('field_of_study')->onUpdate('cascade')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign('fk_users_address');
            $table->dropForeign('fk_users_company');
            $table->dropForeign('fk_users_department');
            $table->dropForeign('fk_users_fos');
        });
    }
};
