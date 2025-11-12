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
        Schema::create('documents', function (Blueprint $table) {
            $table->integer('document_id', true);
            $table->integer('document_type_id')->index('idx_doc_type');
            $table->integer('internship_id')->index('idx_doc_internship');
            $table->string('document_name');
            $table->string('file_path', 500);
            $table->integer('uploaded_by_user_id')->index('idx_doc_uploader');
            $table->timestamp('uploaded_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
