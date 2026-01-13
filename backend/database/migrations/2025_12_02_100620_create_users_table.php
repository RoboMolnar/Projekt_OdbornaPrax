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
        Schema::create('users', function (Blueprint $table) {
            $table->integer('user_id', true);
            $table->enum('role', ['student', 'garant', 'company', 'admin', 'external'])->index('idx_users_role');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('email')->unique('uk_users_email');
            $table->string('phone_number', 20)->nullable();
            $table->string('password');
            $table->boolean('must_change_password')->default(true);
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->boolean('active')->default(true);
            $table->string('title', 45)->nullable();
            $table->integer('year_of_study')->nullable();
            $table->string('study_type', 45)->nullable();
            $table->integer('field_of_study_id')->nullable()->index('idx_users_fos');
            $table->integer('department_id')->nullable()->index('idx_users_dept');
            $table->integer('address_id')->nullable()->index('idx_users_address');
            $table->integer('company_id')->nullable()->index('idx_users_company');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrentOnUpdate()->useCurrent();
            $table->rememberToken();
            $table->timestamp('activated_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
