<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('alternative_email', 255)->nullable()->after('email');

            // voliteľné (ak chceš, aby sa alt email neopakoval medzi používateľmi):
            // $table->unique('alternative_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // ak si pridal unique, odkomentuj:
            // $table->dropUnique(['alternative_email']);
            $table->dropColumn('alternative_email');
        });
    }
};