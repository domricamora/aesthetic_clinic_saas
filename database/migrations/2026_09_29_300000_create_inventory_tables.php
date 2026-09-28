<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Stock by batch, per branch, with a ledger of every movement
 * (plan.md 21, 22). Opening balances come from products.stock_on_hand, which
 * this migration retires in favour of the per-branch rows.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['organization_id', 'name']);
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('lot_number', 60)->nullable();
            $table->date('expires_on')->nullable();
            $table->date('received_on');
            $table->unsignedInteger('quantity')->default(0);
            $table->decimal('cost', 10, 2)->default(0);
            $table->string('note')->nullable();
            $table->timestamps();
            // FEFO reads batches of one product at one branch, soonest expiry first.
            $table->index(['product_id', 'branch_id', 'expires_on'], 'batches_fefo_index');
        });

        Schema::create('product_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('on_hand')->default(0);
            $table->unsignedInteger('reorder_level')->default(0);
            $table->timestamps();
            $table->unique(['product_id', 'branch_id']);
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->foreignId('user_id')->constrained();
            // Signed: positive is stock in, negative is stock out.
            $table->integer('quantity');
            $table->string('type', 20);
            $table->decimal('cost', 10, 2)->default(0);
            $table->string('reference', 40)->nullable();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['product_id', 'created_at']);
            $table->index(['branch_id', 'created_at']);
        });

        $this->openStockFromProducts();
    }

    /** Moves the seeded counter stock onto the first branch as a dated opening batch. */
    protected function openStockFromProducts(): void
    {
        $branches = DB::table('branches')->orderBy('id')->pluck('id');
        $today = now()->toDateString();

        foreach (DB::table('products')->orderBy('id')->get() as $product) {
            $opening = 0;

            foreach ($branches->values() as $index => $branchId) {
                $onHand = $index === 0 ? (int) $product->stock_on_hand : 0;
                $batchId = null;

                if ($onHand > 0) {
                    $batchId = DB::table('product_batches')->insertGetId([
                        'organization_id' => $product->organization_id,
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                        'received_on' => $today,
                        'quantity' => $onHand,
                        'cost' => $product->cost,
                        'note' => 'Opening balance',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('product_stocks')->insert([
                    'organization_id' => $product->organization_id,
                    'product_id' => $product->id,
                    'branch_id' => $branchId,
                    'on_hand' => $onHand,
                    'reorder_level' => $product->reorder_level,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                if ($onHand > 0) {
                    DB::table('inventory_movements')->insert([
                        'organization_id' => $product->organization_id,
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                        'batch_id' => $batchId,
                        'user_id' => DB::table('users')->orderBy('id')->value('id'),
                        'quantity' => $onHand,
                        'type' => 'opening',
                        'cost' => $product->cost,
                        'note' => 'Opening balance',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $opening += $onHand;
                }
            }

            DB::table('products')->where('id', $product->id)->update([
                'stock_on_hand' => $opening,
            ]);
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock_on_hand', 'reorder_level']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock_on_hand')->default(0);
            $table->unsignedInteger('reorder_level')->default(0);
        });

        DB::table('products')->orderBy('id')->each(function ($product) {
            $total = DB::table('product_stocks')
                ->where('product_id', $product->id)
                ->sum('on_hand');
            $reorder = DB::table('product_stocks')
                ->where('product_id', $product->id)
                ->max('reorder_level');

            DB::table('products')->where('id', $product->id)->update([
                'stock_on_hand' => (int) $total,
                'reorder_level' => (int) $reorder,
            ]);
        });

        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('product_stocks');
        Schema::dropIfExists('product_batches');
        Schema::dropIfExists('suppliers');
    }
};
