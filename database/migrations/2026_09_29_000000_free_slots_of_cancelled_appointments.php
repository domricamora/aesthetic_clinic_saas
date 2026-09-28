<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The double-booking guard only counts live visits: a cancelled or
 * rescheduled appointment gives its slot back. active_start is NULL for
 * those, and MySQL unique indexes allow many NULLs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dateTime('active_start')->nullable()->storedAs("IF(status IN ('cancelled', 'rescheduled'), NULL, starts_at)")->after('ends_at');
            $table->unique(['specialist_id', 'active_start']);
            $table->dropUnique(['specialist_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->unique(['specialist_id', 'starts_at']);
            $table->dropUnique(['specialist_id', 'active_start']);
            $table->dropColumn('active_start');
        });
    }
};
