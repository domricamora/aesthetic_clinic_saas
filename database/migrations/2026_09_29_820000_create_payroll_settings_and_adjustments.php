<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the clinic actually deducts, kept where the office can change it
 * (plan.md §26).
 *
 * Contribution ceilings and rates move with law and are adjusted by circulars
 * through the year, so they cannot live only in a config file nobody opens.
 * The config remains the default and the fallback; this table is what the
 * clinic overrides, per organisation.
 *
 * Adjustments are the deductions that are not the government: a loan, a
 * salary advance, a garnishment. Without somewhere to keep them there is no
 * way to record one and the payslip line is dead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->decimal('sss_rate', 5, 4)->default(0.05);
            $table->decimal('sss_ceiling', 10, 2)->default(35000);
            $table->decimal('sss_max', 10, 2)->default(1750);
            $table->decimal('philhealth_rate', 5, 4)->default(0.025);
            $table->decimal('philhealth_ceiling', 10, 2)->default(10000);
            $table->decimal('philhealth_max', 10, 2)->default(250);
            $table->decimal('pagibig_rate', 5, 4)->default(0.01);
            $table->decimal('pagibig_ceiling', 10, 2)->default(5000);
            $table->decimal('pagibig_max', 10, 2)->default(50);
            $table->date('effective_from')->nullable();
            $table->timestamps();
            $table->unique('organization_id');
        });

        Schema::create('payroll_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            // A period of null means it comes off every run until it is cleared.
            $table->string('period', 7)->nullable();
            $table->string('label', 120);
            $table->string('kind', 20)->default('loan');   // loan advance other
            $table->decimal('amount', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_adjustments');
        Schema::dropIfExists('payroll_settings');
    }
};
