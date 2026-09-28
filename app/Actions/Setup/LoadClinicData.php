<?php

namespace App\Actions\Setup;

use App\Models\Account;
use App\Models\MembershipTier;
use App\Models\Page;
use App\Models\Post;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use Database\Seeders\AccountingSeeder;
use Database\Seeders\MarketingContentSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SiteContentSeeder;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;

/**
 * Loads the rows a clinic needs before it can trade: the permissions its
 * screens are gated on, the chart of accounts the ledger posts against, and
 * the content the public site reads.
 *
 * Deliberately narrower than DatabaseSeeder, which builds the fictional demo
 * clinic. That one also creates demo logins with a password published in the
 * repository, demo branches, and demo trading records. This action writes
 * only reference and marketing content, so it is safe to press on a live
 * installation and safe to press again -- the seeders underneath are all
 * updateOrCreate, keyed on the slug or code.
 */
class LoadClinicData
{
    /** Seeders that write reference or content rows, never a login. */
    public const SEEDERS = [
        RolesAndPermissionsSeeder::class,
        AccountingSeeder::class,
        SiteContentSeeder::class,
        MarketingContentSeeder::class,
    ];

    /**
     * @return array{seeders: int, counts: array<int, array{key: string, label: string, count: int}>}
     */
    public function __invoke(): array
    {
        foreach (self::SEEDERS as $seeder) {
            // --force because on a live server the command would otherwise stop
            // and ask the operator to confirm, which nobody is there to answer.
            Artisan::call('db:seed', ['--class' => $seeder, '--force' => true]);
        }

        return [
            'seeders' => count(self::SEEDERS),
            'counts' => self::counts(),
        ];
    }

    /**
     * What is loaded right now, for the dashboard and the setup screen.
     *
     * @return array<int, array{key: string, label: string, count: int}>
     */
    public static function counts(): array
    {
        return [
            ['key' => 'treatments', 'label' => 'Treatments', 'count' => Treatment::count()],
            ['key' => 'categories', 'label' => 'Treatment categories', 'count' => TreatmentCategory::count()],
            ['key' => 'products', 'label' => 'Products', 'count' => Product::count()],
            ['key' => 'tiers', 'label' => 'Membership tiers', 'count' => MembershipTier::count()],
            ['key' => 'promotions', 'label' => 'Promotions', 'count' => Promotion::count()],
            ['key' => 'posts', 'label' => 'Journal articles', 'count' => Post::count()],
            ['key' => 'pages', 'label' => 'Pages', 'count' => Page::count()],
            ['key' => 'accounts', 'label' => 'Ledger accounts', 'count' => Account::count()],
            ['key' => 'roles', 'label' => 'Roles', 'count' => Role::count()],
        ];
    }
}
