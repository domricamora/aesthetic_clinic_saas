<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Settings the office edits, rather than settings a developer edits.
 *
 * Brand colours, rates and the default TAX table belong in code, because they
 * are the product. The clinic's own social handles, whether the chat is on,
 * and which campaigns are running belong to the operator, and a thing that
 * changes per clinic cannot be a config file -- one deployment serves every
 * installation, so a config value would be the same for all of them.
 *
 * Key and value rather than a column each: the list of things a clinic will
 * want to change is not finished, and a new one should not need a migration.
 * The typed helpers on the model are what the rest of the code calls, so a
 * string in here never leaks into a link or a query.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('key', 60);
            $table->text('value')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_settings');
    }
};
