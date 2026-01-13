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
        Schema::create('company', function (Blueprint $table) {
            $table->integer('company_id', true);
            $table->string('company_name', 120)->unique('uk_company_name');
            $table->string('ico', 45)->nullable();
            $table->string('dic', 45)->nullable();
            $table->string('email')->nullable();
            $table->string('phone_contact', 45)->nullable();
            $table->integer('address_id')->nullable()->index('idx_company_address');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company');
    }
};
