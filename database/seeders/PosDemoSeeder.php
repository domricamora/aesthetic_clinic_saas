<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\InventoryMovement;
use App\Models\Organization;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The counter catalogue and the shelves behind it (plan.md §19, §21, §22).
 * Only the Makati branch is stocked, so the branch filter has something to
 * show, and a few lots carry an expiry so the expiry alerts are not empty.
 * These rows are the opening state; after this the ledger owns the numbers.
 */
class PosDemoSeeder extends Seeder
{
    /**
     * name, category, price, cost, units, reorder level, days to expiry (null = no expiry), note
     *
     * @var array<int, array<int, mixed>>
     */
    private const PRODUCTS = [
        ['Cleansing balm, 100ml', 'Skincare', 1850, 900, 24, 6, null, 'A calm, non-foaming cleanse for the evening routine.'],
        ['Vitamin C serum, 30ml', 'Skincare', 3200, 1650, 18, 6, 45, 'Brightening serum, morning, before moisturiser.'],
        ['SPF 50 sunscreen, 50ml', 'Skincare', 2450, 1150, 30, 8, 20, 'Daily protection. Reapply every two hours in direct sun.'],
        ['Ceramide moisturiser, 50ml', 'Skincare', 2890, 1400, 20, 6, null, 'Barrier support for skin that reacts after a treatment.'],
        ['Post-treatment recovery balm', 'Aftercare', 1500, 700, 40, 10, -5, 'Soothes and protects for the days after a peel.'],
        ['Hydra Facial at home kit', 'Aftercare', 2200, 1050, 15, 4, null, 'Cleanser, serum and cream in the order the facial uses them.'],
        ['Hair growth scalp serum', 'Retail', 2650, 1250, 12, 4, null, 'Leave-in scalp serum, once daily.'],
        ['SPF lip balm', 'Retail', 450, 200, 60, 15, null, 'Daily lip protection for Makati afternoons.'],
    ];

    public function run(): void
    {
        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();
        $branches = Branch::where('organization_id', $organization->id)->orderBy('id')->get();
        $mainBranch = $branches->first();
        $staff = User::where('organization_id', $organization->id)->orderBy('id')->first();
        $supplier = Supplier::firstOrCreate(['name' => 'Dermatix Philippines'], [
            'contact_name' => 'Rina Bautista',
            'phone' => '0917 555 0110',
            'email' => 'orders@dermatix.test',
            'address' => '12 Kalayaan Avenue, Quezon City',
        ]);

        foreach (self::PRODUCTS as $index => [$name, $category, $price, $cost, $units, $reorder, $expiry, $description]) {
            $product = Product::updateOrCreate(
                ['organization_id' => $organization->id, 'slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'sku' => 'P'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'category' => $category,
                    'description' => $description,
                    'price' => $price,
                    'cost' => $cost,
                    'is_active' => true,
                ]
            );

            $expiresOn = $expiry === null ? null : today()->addDays($expiry);
            $lot = $expiry === null ? 'LOT-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT) : null;

            $batch = ProductBatch::updateOrCreate(
                ['product_id' => $product->id, 'note' => 'Opening balance'],
                [
                    'branch_id' => $mainBranch->id,
                    'supplier_id' => $supplier->id,
                    'lot_number' => $lot,
                    'expires_on' => $expiresOn,
                    'received_on' => today()->subDays(20),
                    'quantity' => $units,
                    'cost' => $cost,
                ]
            );

            InventoryMovement::create([
                'product_id' => $product->id,
                'branch_id' => $mainBranch->id,
                'batch_id' => $batch->id,
                'user_id' => $staff->id,
                'quantity' => $units,
                'type' => 'opening',
                'cost' => $cost,
                'note' => 'Opening balance',
            ]);

            foreach ($branches as $branch) {
                ProductStock::updateOrCreate(
                    ['product_id' => $product->id, 'branch_id' => $branch->id],
                    ['on_hand' => $branch->id === $mainBranch->id ? $units : 0, 'reorder_level' => $reorder],
                );
            }
        }
    }
}
