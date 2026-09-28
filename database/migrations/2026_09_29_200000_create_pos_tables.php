<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Point of sale: the retail catalogue and the sales it records (plan.md §19). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('sku')->nullable();
            $table->string('category', 60)->default('Skincare');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2)->default(0);
            $table->unsignedInteger('stock_on_hand')->default(0);
            $table->unsignedInteger('reorder_level')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['organization_id', 'slug']);
            $table->unique(['organization_id', 'sku']);
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('reference', 24)->unique();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('user_id')->constrained(); // the cashier
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('promotion_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_name')->nullable();
            $table->string('client_phone', 30)->nullable();
            $table->decimal('subtotal', 10, 2);
            $table->string('discount_type', 10)->default('none');
            $table->decimal('discount_value', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            // Denormalised from payments, kept in step inside the sale transaction.
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->string('status', 16)->default('unpaid');
            $table->text('note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'created_at']);
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            // A line is a service from the treatment catalogue or a retail product.
            $table->string('kind', 10);
            $table->foreignId('treatment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description'); // snapshot, the catalogue may change later
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('line_total', 10, 2);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->string('method', 20);
            $table->string('type', 10)->default('payment'); // payment | refund
            $table->decimal('amount', 10, 2);
            $table->string('reference')->nullable(); // provider or till reference
            $table->string('note')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->timestamp('paid_at');
            $table->timestamps();
            $table->index(['sale_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('products');
    }
};
