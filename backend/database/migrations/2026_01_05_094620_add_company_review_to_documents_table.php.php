<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('company_review_status', 20)->nullable()->after('uploaded_by_user_id');
            // hodnoty: null | 'pending' | 'approved' | 'rejected'
            $table->unsignedBigInteger('company_reviewed_by_user_id')->nullable()->after('company_review_status');
            $table->timestamp('company_reviewed_at')->nullable()->after('company_reviewed_by_user_id');
            $table->string('company_review_note', 500)->nullable()->after('company_reviewed_at');

            $table->index(['company_review_status']);
            $table->index(['company_reviewed_by_user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['company_review_status']);
            $table->dropIndex(['company_reviewed_by_user_id']);

            $table->dropColumn([
                'company_review_status',
                'company_reviewed_by_user_id',
                'company_reviewed_at',
                'company_review_note',
            ]);
        });
    }
};
