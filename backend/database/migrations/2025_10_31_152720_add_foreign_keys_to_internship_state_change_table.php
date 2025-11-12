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
        Schema::table('internship_state_change', function (Blueprint $table) {
            $table->foreign(['changed_by_user_id'], 'fk_isc_changed_by')->references(['user_id'])->on('users')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['from_state_id'], 'fk_isc_from_state')->references(['internship_state_id'])->on('internship_state')->onUpdate('cascade')->onDelete('set null');
            $table->foreign(['internship_id'], 'fk_isc_internship')->references(['internship_id'])->on('internship')->onUpdate('cascade')->onDelete('cascade');
            $table->foreign(['to_state_id'], 'fk_isc_to_state')->references(['internship_state_id'])->on('internship_state')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internship_state_change', function (Blueprint $table) {
            $table->dropForeign('fk_isc_changed_by');
            $table->dropForeign('fk_isc_from_state');
            $table->dropForeign('fk_isc_internship');
            $table->dropForeign('fk_isc_to_state');
        });
    }
};
