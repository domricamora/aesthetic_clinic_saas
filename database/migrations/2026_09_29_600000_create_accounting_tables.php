<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Double-entry accounting (plan.md 24): a chart of accounts, journal entries
 * with debit and credit lines, and the periods that lock them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name', 120);
            $table->string('type', 20);       // asset liability equity revenue expense
            $table->string('normal_balance', 6); // debit or credit
            $table->string('note')->nullable();
            // A system account is one the modules post to; it cannot be deleted.
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
            $table->unique(['organization_id', 'code']);
        });

        Schema::create('accounting_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->string('status', 20)->default('open');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['organization_id', 'year', 'month']);
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained(); // who recorded it
            $table->string('entry_no', 30);
            $table->date('entry_date');
            $table->string('memo', 200);
            // manual | pos_sale | pos_refund | payroll | expense | adjustment
            $table->string('source_type', 30)->default('manual');
            $table->string('source_id', 40)->nullable();
            $table->string('status', 20)->default('posted');
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'entry_no']);
            $table->index(['organization_id', 'entry_date']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->string('memo')->nullable();
            $table->timestamps();
            $table->index(['account_id', 'journal_entry_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('accounting_periods');
        Schema::dropIfExists('accounts');
    }
};
