<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who works here and when they were in: employee records, the daily
 * time-in/out log and leave (plan.md 28). Payroll reads all three.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            // A staff member may sign in to the desk, or exist on paper only.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_no', 20);
            $table->string('name');
            $table->string('position', 80);
            $table->string('department', 60)->default('Clinic');
            $table->string('phone', 30)->nullable();
            $table->date('hire_date');
            $table->string('employment_type', 20)->default('regular');
            $table->string('pay_schedule', 20)->default('monthly');
            $table->decimal('base_salary', 10, 2)->default(0);
            $table->decimal('monthly_allowance', 10, 2)->default(0);
            $table->string('status', 20)->default('active');
            $table->date('resigned_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'employee_no']);
            $table->unique(['organization_id', 'user_id']);
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->unsignedInteger('minutes')->default(0);
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->string('note')->nullable();
            $table->timestamps();
            // One row per person per day; the clock in is an upsert.
            $table->unique(['employee_id', 'work_date']);
            $table->index(['organization_id', 'work_date']);
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type', 20)->default('annual');
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('days', 5, 2)->default(1);
            $table->string('reason')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('review_note')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('employees');
    }
};
