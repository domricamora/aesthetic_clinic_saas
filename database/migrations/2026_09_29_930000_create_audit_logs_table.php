<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who did what, and when (plan.md 31, §96).
 *
 * A refund, a stock adjustment, a payroll run approved or paid, a role
 * changed: each of those moves money or trust, and none of them left a trace.
 * An operator with a discrepancy has nothing to look at, and the person being
 * asked about it has nothing to answer with.
 *
 * Entries are written by the action that did the thing, not by a middleware
 * watching for changes. A watcher can only say what the database looks like
 * afterwards; the action knows what it refused, what it charged and why, and
 * that is the part worth keeping.
 *
 * The ip and user agent are kept because "who" is not a complete answer to
 * "who", but they are kept for staff actions only. Recording where a member of
 * the public came from is a different question with different consent, and it
 * belongs on leads rather than here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // "sale.refund", "inventory.adjust", "auth.login": a dotted verb so
            // the column can be grouped and filtered without parsing prose.
            $table->string('action', 60);

            // What it was done to, as "App\Models\Sale" and 41. Not a real
            // morph because the subject is often gone afterwards -- a voided
            // entry has to still say what it referred to.
            $table->string('subject_type', 120)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();

            // The sentence an operator would want to read.
            $table->text('description');

            // Amounts, counts, before and after. Whatever the reader would
            // otherwise have to go and reconstruct.
            $table->json('context')->nullable();

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'created_at']);
            $table->index(['action']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
