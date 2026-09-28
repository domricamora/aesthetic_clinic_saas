<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Marketing content that is not part of the clinic record: tiers, promos, articles, legal pages. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('tagline');
            $table->decimal('price_monthly', 10, 2);
            $table->json('benefits');
            $table->string('note')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
        });

        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('treatment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('summary');
            $table->text('description');
            $table->json('details')->nullable();
            $table->string('badge')->nullable();
            $table->date('ends_on')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
        });

        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('category', 40);
            $table->string('excerpt');
            $table->text('body');
            $table->json('takeaways')->nullable();
            $table->string('image')->nullable();
            $table->string('author_name');
            $table->unsignedTinyInteger('read_minutes')->default(4);
            $table->boolean('is_published')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'published_at']);
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('summary')->nullable();
            $table->json('sections');
            $table->date('reviewed_on')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('membership_tiers');
    }
};
