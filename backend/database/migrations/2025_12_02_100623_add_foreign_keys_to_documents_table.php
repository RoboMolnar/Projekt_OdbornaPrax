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
        Schema::table('documents', function (Blueprint $table) {
            $table->foreign(['internship_id'], 'fk_doc_internship')->references(['internship_id'])->on('internship')->onUpdate('cascade')->onDelete('cascade');
            $table->foreign(['document_type_id'], 'fk_doc_type')->references(['document_type_id'])->on('document_type')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['uploaded_by_user_id'], 'fk_doc_user')->references(['user_id'])->on('users')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign('fk_doc_internship');
            $table->dropForeign('fk_doc_type');
            $table->dropForeign('fk_doc_user');
        });
    }
};
