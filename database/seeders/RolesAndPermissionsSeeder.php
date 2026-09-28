<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Roles from plan.md §30. Permissions grow module by module; Super Admin
 * gets everything through Gate::before (AppServiceProvider).
 */
class RolesAndPermissionsSeeder extends Seeder
{
    public const PERMISSIONS = [
        'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
        'appointments.view', 'appointments.create', 'appointments.edit', 'appointments.delete',
        'pos.view', 'pos.create', 'pos.refund',
        'inventory.view', 'inventory.create',
        'hr.view', 'hr.create',
        'payroll.view', 'payroll.create',
        'accounting.view', 'accounting.create',
        'content.view', 'content.edit',
        'settings.view', 'settings.edit',
    ];

    public const ROLES = [
        'Super Admin' => [],
        'Organization Owner' => self::PERMISSIONS,
        'Clinic Administrator' => self::PERMISSIONS,
        'Branch Manager' => ['leads.view', 'leads.create', 'leads.edit', 'appointments.view', 'appointments.create', 'appointments.edit', 'pos.view', 'pos.create', 'inventory.view', 'inventory.create', 'content.view'],
        'Doctor' => ['appointments.view'],
        'Nurse' => ['appointments.view'],
        'Aesthetician' => ['appointments.view'],
        'Therapist' => ['appointments.view'],
        'Receptionist' => ['leads.view', 'leads.create', 'leads.edit', 'appointments.view', 'appointments.create', 'appointments.edit', 'pos.view', 'pos.create', 'pos.refund', 'inventory.view', 'hr.view'],
        'Cashier' => ['pos.view', 'pos.create', 'pos.refund', 'inventory.view', 'hr.view'],
        'Accountant' => ['accounting.view', 'accounting.create', 'payroll.view', 'hr.view', 'inventory.view', 'pos.view', 'pos.view'],
        'HR Manager' => ['hr.view', 'hr.create', 'payroll.view', 'accounting.view'],
        'Inventory Manager' => ['inventory.view', 'inventory.create', 'pos.view'],
        'Marketing Manager' => ['leads.view', 'leads.edit', 'content.view', 'content.edit'],
        'Patient' => [],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name);
        }

        foreach (self::ROLES as $name => $permissions) {
            Role::findOrCreate($name)->syncPermissions($permissions);
        }
    }
}
