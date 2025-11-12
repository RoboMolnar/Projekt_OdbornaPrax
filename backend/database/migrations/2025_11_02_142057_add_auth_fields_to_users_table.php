<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // boolean - používateľ musí po prvom logine zmeniť heslo
            if (!Schema::hasColumn('users', 'must_change_password')) {
                $table->boolean('must_change_password')->default(true)->after('password');
            }

            // boolean - či je účet aktívny (študent áno, firma nie po registrácii)
            if (!Schema::hasColumn('users', 'active')) {
                // Nepoužívaj 'after("remember_token")' kvôli starším schémam bez tohto stĺpca
                $table->boolean('active')->default(true);
            }

            // čas aktivácie (firma po kliknutí na aktivačný e-mail)
            if (!Schema::hasColumn('users', 'activated_at')) {
                $table->timestamp('activated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'must_change_password')) {
                $table->dropColumn('must_change_password');
            }
            if (Schema::hasColumn('users', 'active')) {
                $table->dropColumn('active');
            }
            if (Schema::hasColumn('users', 'activated_at')) {
                $table->dropColumn('activated_at');
            }
        });
    }
};
