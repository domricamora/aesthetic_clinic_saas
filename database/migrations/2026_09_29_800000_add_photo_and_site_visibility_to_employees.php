<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff can have a face on the website, but not by default: being paid by the
 * clinic does not mean agreeing to be advertised. Publishing is a deliberate
 * tick per person (plan.md 2, 28).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('photo', 255)->nullable()->after('focus');
            $table->boolean('show_on_site')->default(false)->after('photo');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['photo', 'show_on_site']);
        });
    }
};
