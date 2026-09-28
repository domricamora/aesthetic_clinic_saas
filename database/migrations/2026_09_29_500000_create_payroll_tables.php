<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A pay run and the payslips under it (plan.md §26). Every figure is stored
 * on the payslip, so what was paid stays true even if a rate is changed later.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // who prepared it
            $table->string('label', 60);
            $table->date('period_start');
            $table->date('period_end');
            $table->date('paid_on');
            $table->string('status', 20)->default('draft');
            $table->decimal('total_gross', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('total_net', 12, 2)->default(0);
            $table->string('note')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'label']);
            $table->index(['organization_id', 'period_start']);
        });

        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payroll_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained();
            $table->decimal('days_paid', 5, 2)->default(0);
            $table->decimal('basic', 12, 2)->default(0);
            $table->decimal('allowance', 12, 2)->default(0);
            $table->decimal('commission', 12, 2)->default(0);
            $table->decimal('overtime', 12, 2)->default(0);
            $table->decimal('unpaid_deduction', 12, 2)->default(0);
            $table->decimal('gross', 12, 2)->default(0);
            $table->decimal('sss', 12, 2)->default(0);
            $table->decimal('philhealth', 12, 2)->default(0);
            $table->decimal('pagibig', 12, 2)->default(0);
            $table->decimal('withholding_tax', 12, 2)->default(0);
            $table->decimal('other_deductions', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('net', 12, 2)->default(0);
            $table->string('note')->nullable();
            $table->timestamps();
            $table->unique(['payroll_run_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_runs');
    }
};
