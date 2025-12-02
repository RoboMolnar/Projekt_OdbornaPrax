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
        Schema::create('internship_state_change', function (Blueprint $table) {
            $table->integer('internship_state_change_id', true);
            $table->integer('internship_id')->index('idx_isc_internship');
            $table->integer('from_state_id')->nullable()->index('fk_isc_from_state');
            $table->integer('to_state_id')->index('idx_isc_to_state');
            $table->integer('changed_by_user_id')->index('idx_isc_changed_by');
            $table->string('note', 500)->nullable();
            $table->timestamp('changed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internship_state_change');
    }
};
