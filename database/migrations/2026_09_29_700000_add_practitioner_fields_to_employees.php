<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A clinician is not just an employee with a different job title (plan.md §28):
 * they carry credentials and a focus, and the clinic needs to tell them apart
 * from the people at the front desk when it comes to who can treat and who is
 * on the books.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('practitioner')->default(false)->after('department');
            $table->string('credentials', 120)->nullable()->after('practitioner');
            $table->string('focus', 160)->nullable()->after('credentials');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['practitioner', 'credentials', 'focus']);
        });
    }
};
