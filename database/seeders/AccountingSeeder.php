<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AccountingPeriod;
use App\Models\Organization;
use Illuminate\Database\Seeder;

/**
 * The chart of accounts (plan.md §24). Codes are the ones a clinic book would
 * recognise, and the ones the POS and payroll post against.
 */
class AccountingSeeder extends Seeder
{
    /** code, name, type, normal balance */
    private const CHART = [
        ['1000', 'Cash on hand', 'asset', 'debit'],
        ['1010', 'Bank account', 'asset', 'debit'],
        ['1200', 'Accounts receivable', 'asset', 'debit'],
        ['1300', 'Inventory', 'asset', 'debit'],
        ['1400', 'Supplies prepaid', 'asset', 'debit'],
        ['2000', 'Accounts payable', 'liability', 'credit'],
        ['2100', 'SSS payable', 'liability', 'credit'],
        ['2110', 'PhilHealth payable', 'liability', 'credit'],
        ['2120', 'Pag-IBIG payable', 'liability', 'credit'],
        ['2130', 'Withholding tax payable', 'liability', 'credit'],
        ['2200', 'Salaries payable', 'liability', 'credit'],
        ['3000', 'Owner capital', 'equity', 'credit'],
        ['3100', 'Owner drawings', 'equity', 'debit'],
        ['4000', 'Service revenue', 'revenue', 'credit'],
        ['4010', 'Product sales', 'revenue', 'credit'],
        ['4020', 'Sales discounts', 'revenue', 'debit'],
        ['5000', 'Cost of goods sold', 'expense', 'debit'],
        ['5100', 'Salaries and wages', 'expense', 'debit'],
        ['5110', 'Employer contributions', 'expense', 'debit'],
        ['5200', 'Rent', 'expense', 'debit'],
        ['5210', 'Utilities', 'expense', 'debit'],
        ['5220', 'Marketing', 'expense', 'debit'],
        ['5230', 'Supplies expense', 'expense', 'debit'],
        ['5240', 'Professional fees', 'expense', 'debit'],
        ['5250', 'Bank charges', 'expense', 'debit'],
    ];

    public function run(): void
    {
        $organization = Organization::where('slug', config('clinic.organization'))->firstOrFail();

        foreach (self::CHART as $sort => [$code, $name, $type, $balance]) {
            Account::updateOrCreate(
                ['organization_id' => $organization->id, 'code' => $code],
                ['name' => $name, 'type' => $type, 'normal_balance' => $balance, 'is_system' => true, 'sort' => $sort],
            );
        }

        // Twelve months of books that can be posted into.
        $cursor = now()->startOfMonth()->subMonths(5);

        for ($i = 0; $i < 12; $i++) {
            AccountingPeriod::firstOrCreate([
                'organization_id' => $organization->id,
                'year' => (int) $cursor->year,
                'month' => (int) $cursor->month,
            ], ['status' => 'open']);

            $cursor = $cursor->addMonth();
        }
    }
}
