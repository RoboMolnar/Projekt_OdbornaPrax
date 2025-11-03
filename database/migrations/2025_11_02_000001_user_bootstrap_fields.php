<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users','role')) {
                $table->string('role', 50)->default('student')->after('email');
            }
            if (!Schema::hasColumn('users','must_change_password')) {
                $table->boolean('must_change_password')->default(true)->after('password');
            }
            if (!Schema::hasColumn('users','is_active')) {
                $table->boolean('is_active')->default(true)->after('remember_token'); // študent = true, firma sa nastaví na false pri registrácii firmy
            }
            if (!Schema::hasColumn('users','activated_at')) {
                $table->timestamp('activated_at')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users','activated_at')) $table->dropColumn('activated_at');
            if (Schema::hasColumn('users','is_active')) $table->dropColumn('is_active');
            if (Schema::hasColumn('users','must_change_password')) $table->dropColumn('must_change_password');
        });
    }
};
