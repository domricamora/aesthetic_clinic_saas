<?php

namespace App\Actions\Setup;

use App\Models\Account;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Lead;
use App\Models\MembershipTier;
use App\Models\Post;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sale;
use App\Models\Treatment;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;

/**
 * Loads the clinic's data from the dashboard, the same set that
 * `php artisan db:seed` builds locally: permissions, the chart of accounts,
 * the public site content, and the demo trading records the dashboards and
 * reports are written against.
 *
 * The demo records are the point as much as the content. A clinic with no
 * appointments, no sales and no staff history has screens that cannot be
 * judged -- reports are empty for want of rows rather than because anything
 * is wrong, and there is no way to tell those apart by looking.
 *
 * Two things this must not do, and the seeders underneath it are arranged to
 * make sure it does neither. It must not change the password of an account
 * that already exists, or re-seeding an installation would quietly reopen
 * every login in the repository to whoever has read it. And it must not
 * rename a branch, or a clinic that has renamed its own would have the demo
 * name put back.
 */
class LoadClinicData
{
    /** The same seeder `php artisan db:seed` runs, so both match. */
    public const SEEDER = DatabaseSeeder::class;

    /**
     * @return array{seeders: int, counts: array<int, array{key: string, label: string, count: int}>}
     */
    public function __invoke(): array
    {
        // --force because on a live server the command would otherwise stop
        // and ask the operator to confirm, which nobody is there to answer.
        Artisan::call('db:seed', ['--class' => self::SEEDER, '--force' => true]);

        return [
            'seeders' => 1,
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
            ['key' => 'products', 'label' => 'Products', 'count' => Product::count()],
            ['key' => 'tiers', 'label' => 'Membership tiers', 'count' => MembershipTier::count()],
            ['key' => 'promotions', 'label' => 'Promotions', 'count' => Promotion::count()],
            ['key' => 'posts', 'label' => 'Journal articles', 'count' => Post::count()],
            ['key' => 'employees', 'label' => 'Staff', 'count' => Employee::count()],
            ['key' => 'appointments', 'label' => 'Appointments', 'count' => Appointment::count()],
            ['key' => 'leads', 'label' => 'Enquiries', 'count' => Lead::count()],
            ['key' => 'sales', 'label' => 'Sales', 'count' => Sale::count()],
            ['key' => 'accounts', 'label' => 'Ledger accounts', 'count' => Account::count()],
            ['key' => 'branches', 'label' => 'Branches', 'count' => Branch::count()],
            ['key' => 'users', 'label' => 'Users', 'count' => User::count()],
        ];
    }
}
