<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Website chat, and the front desk that answers it (plan.md §13, §84).
 *
 * A conversation is a visitor and a member of staff, identified by a token the
 * visitor's browser holds rather than an account: somebody asking whether a
 * treatment hurts has not signed up to anything yet, and making them register
 * before they will ask a question loses the enquiry.
 *
 * A conversation is attached to a lead as soon as the visitor gives a name and
 * a number. That is deliberate rather than a shortcut -- the front desk cannot
 * follow up with somebody whose name and number they were never given, and a
 * chat that never reaches the lead list is a chat that quietly stops happening.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('token')->unique();
            $table->string('status', 20)->default('open');   // open closed
            $table->string('page', 200)->nullable();          // where they were
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('from', 10)->default('visitor');   // visitor staff
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['chat_conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
