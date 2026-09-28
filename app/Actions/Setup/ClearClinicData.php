<?php

namespace App\Actions\Setup;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Empties a demonstration installation so it can be shown to the next clinic
 * with nothing left over from the last one.
 *
 * The table list is written out rather than derived. The obvious alternative --
 * "truncate everything that isn't users, organizations or branches" -- is one
 * forgotten table away from signing the demonstration's own audience out, and
 * the failure would not surface until someone tried to log in. Spelling the
 * list out means a new table is empty by default, and adding it here is a
 * deliberate act.
 *
 * What survives is everything needed to sign in and keep signing in: the
 * accounts, the clinic and its branches, the roles, and the uploaded photos.
 */
class ClearClinicData
{
    /**
     * Seeded and transactional tables. Foreign keys are suspended for the
     * duration, so order does not matter.
     *
     * @var list<string>
     */
    public const TABLES = [
        // Public site content.
        'treatment_categories', 'treatments', 'faqs', 'testimonials',
        'specialists', 'branch_specialist', 'pages', 'posts', 'promotions',
        'membership_tiers',
        // Shop and stock.
        'suppliers', 'products', 'product_batches', 'product_stocks',
        'inventory_movements',
        // Trading.
        'sales', 'sale_items', 'payments',
        // Books.
        'accounts', 'journal_entries', 'journal_lines', 'accounting_periods',
        // People and pay.
        'employees', 'attendances', 'leave_requests', 'payroll_settings',
        'payroll_adjustments', 'payroll_runs', 'payslips',
        // Pipeline.
        'leads', 'crm_activities', 'appointments',
    ];

    /**
     * @return array{tables: int, total: int, rows: array<string, int>}
     */
    public function __invoke(): array
    {
        $tables = $this->tables();

        // A destructive button that quietly does nothing is the worst possible
        // outcome: the screen says it worked and the next person is looking at
        // yesterday's appointments still there, believing it was cleared.
        if ($tables === []) {
            throw new RuntimeException(
                'ClearClinicData matched none of its tables. Refusing to report success.',
            );
        }

        $rows = [];
        $total = 0;

        // Deliberately not wrapped in a transaction. TRUNCATE is DDL, and in
        // MySQL that commits whatever transaction it is inside -- so the
        // wrapper would not make this atomic, it would only throw on the way
        // out of it. Being able to roll back was never on offer anyway.
        //
        // What is guaranteed instead is that it can be pressed again: every
        // table is emptied outright, so a half-finished run is finished by
        // the next one.
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        try {
            foreach ($tables as $table) {
                $count = DB::table($table)->count();
                // Truncate rather than delete, so the auto-increment counters
                // reset too and a freshly seeded clinic is numbered from 1.
                DB::statement('TRUNCATE TABLE `'.$table.'`');
                $rows[$table] = $count;
                $total += $count;
            }
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return ['tables' => count($tables), 'total' => $total, 'rows' => $rows];
    }

    /**
     * The seeded tables that actually exist in this installation. A table from
     * a migration this build has not run is skipped rather than fatal, so an
     * older database can still be reset.
     *
     * @return list<string>
     */
    public function tables(): array
    {
        // self::TABLES is a list of names, not a keyed map, so it is filtered
        // directly -- array_keys() on a list yields the indices.
        return array_values(array_filter(
            self::TABLES,
            fn (string $table) => Schema::hasTable($table),
        ));
    }
}
