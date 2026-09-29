<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-employee statutory rates (plan.md §26).
 *
 * The clinic sets a default per contribution on the payroll settings screen,
 * and that default is right for almost everyone. It is not right for everyone:
 * a part-time therapist paid below the first SSS bracket, a consultant on
 * retainer for whom PhilHealth is handled another way, a resident exempt from
 * withholding under a TRAIN provision, or someone whose rate changed part-way
 * through the year. Forcing those onto the clinic default means the payroll
 * run quietly produces the wrong number for them.
 *
 * These columns are null by default, and null means "use the clinic's rate" --
 * so an employee who has never been touched behaves exactly as before, and
 * there is no migration of history to reconcile. Blank in the form means the
 * same thing, which is why they are nullable rather than defaulted to a
 * number that would then have to be distinguished from a deliberate choice of
 * that number.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Fraction of the employee's monthly salary, like the clinic rate.
            $table->decimal('sss_rate', 5, 4)->nullable()->after('monthly_allowance');
            $table->decimal('philhealth_rate', 5, 4)->nullable()->after('sss_rate');
            $table->decimal('pagibig_rate', 5, 4)->nullable()->after('philhealth_rate');

            // Withholding is a band table, not one rate, so a per-person figure
            // can only ever be a flat percentage of taxable pay. Setting it
            // replaces the TRAIN table for that employee; leaving it null keeps
            // the table. Labelled as a flat rate in the form so nobody mistakes
            // it for a legal computation.
            $table->decimal('withholding_rate', 5, 4)->nullable()->after('pagibig_rate');
            $table->boolean('tax_exempt')->default(false)->after('withholding_rate');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'sss_rate', 'philhealth_rate', 'pagibig_rate',
                'withholding_rate', 'tax_exempt',
            ]);
        });
    }
};
