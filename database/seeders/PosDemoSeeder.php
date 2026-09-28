<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The counter catalogue (plan.md 19). Retail and aftercare items a client can
 * buy on the day. Stock and reorder levels are a starting point for the demo;
 * purchasing and the stock ledger come with inventory (plan.md 21).
 */
class PosDemoSeeder extends Seeder
{
    /** @var array<int, array<string, mixed>> */
    private const PRODUCTS = [
        ['Cleansing balm, 100ml', 'Skincare', 1850, 900, 24, 6, 'A calm, non-foaming cleanse for the evening routine.'],
        ['Vitamin C serum, 30ml', 'Skincare', 3200, 1650, 18, 6, 'Brightening serum to use in the morning, before moisturiser.'],
        ['SPF 50 sunscreen, 50ml', 'Skincare', 2450, 1150, 30, 8, 'Daily protection. Reapply every two hours in direct sun.'],
        ['Ceramide moisturiser, 50ml', 'Skincare', 2890, 1400, 20, 6, 'Barrier support for skin that reacts after a treatment.'],
        ['Post-treatment recovery balm', 'Aftercare', 1500, 700, 40, 10, 'Soothes and protects for the days after a peel or a laser session.'],
        ['Hydra Facial at home kit', 'Aftercare', 2200, 1050, 15, 4, 'Cleanser, serum and cream in the order the facial uses them.'],
        ['Hair growth scalp serum', 'Retail', 2650, 1250, 12, 4, 'Leave-in scalp serum, once daily.'],
        ['SPF lip balm', 'Retail', 450, 200, 60, 15, 'Daily lip protection for Makati afternoons.'],
    ];

    public function run(): void
    {
        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();

        foreach (self::PRODUCTS as $index => [$name, $category, $price, $cost, $stock, $reorder, $description]) {
            Product::updateOrCreate(
                ['organization_id' => $organization->id, 'slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'sku' => 'P'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'category' => $category,
                    'description' => $description,
                    'price' => $price,
                    'cost' => $cost,
                    'stock_on_hand' => $stock,
                    'reorder_level' => $reorder,
                    'is_active' => true,
                ]
            );
        }
    }
}
