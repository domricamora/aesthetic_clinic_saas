<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_activities', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('lead_id')->constrained()->nullOnDelete();
            $table->text('description')->change();
        });
    }

    public function down(): void
    {
        Schema::table('crm_activities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->string('description')->change();
        });
    }
};
