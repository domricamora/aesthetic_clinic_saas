<?php

use App\Actions\Payroll\CalculatePayslip;
use App\Models\Employee;
use App\Models\PayrollAdjustment;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\DatabaseSeeder;

beforeEach(function () {
    $this->seed(DatabaseSeeder::class);
});

function clerk(): User
{
    return User::where('email', 'owner@patrice.test')->firstOrFail();
}

function theNurse(): Employee
{
    return Employee::where('name', 'Camille Rivera')->firstOrFail();
}

function rates(array $overrides = []): array
{
    return array_merge([
        'sss_rate' => 0.05,
        'sss_ceiling' => 35000,
        'sss_max' => 1750,
        'philhealth_rate' => 0.025,
        'philhealth_ceiling' => 10000,
        'philhealth_max' => 250,
        'pagibig_rate' => 0.01,
        'pagibig_ceiling' => 5000,
        'pagibig_max' => 50,
    ], $overrides);
}

function month(): array
{
    return [
        CarbonImmutable::today()->startOfMonth(),
        CarbonImmutable::today()->endOfMonth(),
    ];
}

it('starts on the config defaults when the clinic has changed nothing', function () {
    $month = (new CalculatePayslip)(make_trainee(), ...month());

    expect($month['sss'])->toBe(1000.0)
        ->and(PayrollSetting::query()->exists())->toBeFalse();
});

function make_trainee(int $baseSalary = 20000): Employee
{
    return Employee::create([
        'employee_no' => 'EMP-DED'.Employee::count(),
        'name' => 'Test Deductions',
        'position' => 'Nurse',
        'department' => 'Clinic',
        'hire_date' => '2024-01-01',
        'employment_type' => 'regular',
        'pay_schedule' => 'monthly',
        'base_salary' => $baseSalary,
        'status' => 'active',
    ]);
}

it('uses the rates the office has saved instead of the defaults', function () {
    // The maximum has to move too, or it caps the higher ceiling straight back down.
    PayrollSetting::create(rates([
        'sss_rate' => 0.04,
        'pagibig_ceiling' => 10000,
        'pagibig_max' => 500,
    ]));

    $month = (new CalculatePayslip)(make_trainee(), ...month());

    expect($month['sss'])->toBe(800.0)
        ->and($month['pagibig'])->toBe(100.0); // 1% of a raised 10,000 ceiling
});

it('caps a contribution at the maximum the office set', function () {
    // A big salary and a low ceiling: the ceiling decides.
    PayrollSetting::create(rates(['pagibig_ceiling' => 100000]));

    $month = (new CalculatePayslip)(
        make_trainee(200000),
        ...month()
    );

    expect($month['pagibig'])->toBe(50.0); // 1% of 200,000 is 2,000, but 50 is the maximum
});

it('edits the rates from the office and the next payslip follows', function () {
    $this->actingAs(clerk())
        ->get('/admin/payroll/settings')
        ->assertOk();

    $this->actingAs(clerk())
        ->patch('/admin/payroll/settings', rates(['sss_rate' => 0.02]))
        ->assertRedirect();

    expect(PayrollSetting::current()->sss_rate)->toBe(0.02)
        ->and((new CalculatePayslip)(make_trainee(), ...month())['sss'])->toBe(400.0);
});

it('refuses a rate that is not a share of the salary', function () {
    $this->actingAs(clerk())
        ->patch('/admin/payroll/settings', rates(['sss_rate' => 5]))
        ->assertSessionHasErrors('sss_rate');
});

it('takes a standing loan off every run until it is cleared', function () {
    $employee = make_trainee();
    $this->actingAs(clerk())->post('/admin/payroll/adjustments', [
        'employee_id' => $employee->id,
        'label' => 'Emergency loan',
        'kind' => 'loan',
        'amount' => 1500,
    ])->assertRedirect();

    $month = (new CalculatePayslip)($employee, ...month());

    expect($month['other_deductions'])->toBe(1500.0)
        ->and($month['net'])->toBe(round($month['gross'] - $month['sss'] - $month['philhealth'] - $month['pagibig'] - 1500, 2));

    $adjustment = PayrollAdjustment::firstOrFail();

    $this->actingAs(clerk())
        ->post("/admin/payroll/adjustments/{$adjustment->id}/clear")
        ->assertRedirect();

    expect($adjustment->refresh()->is_active)->toBeFalse()
        ->and((new CalculatePayslip)($employee, ...month())['other_deductions'])->toBe(0.0);
});

it('takes a one-off deduction off that period only', function () {
    $employee = make_trainee();
    $thisPeriod = CarbonImmutable::today()->startOfMonth()->format('Y-m');
    $nextPeriod = CarbonImmutable::today()->startOfMonth()->addMonth()->format('Y-m');

    PayrollAdjustment::create([
        'employee_id' => $employee->id,
        'label' => 'Garnishment order',
        'kind' => 'other',
        'amount' => 3000,
        'period' => $nextPeriod,
    ]);

    expect((new CalculatePayslip)($employee, ...month())['other_deductions'])->toBe(0.0);

    $next = (new CalculatePayslip)(
        $employee,
        CarbonImmutable::today()->startOfMonth()->addMonth(),
        CarbonImmutable::today()->startOfMonth()->addMonth()->endOfMonth(),
    );

    expect($next['other_deductions'])->toBe(3000.0);
});

it('adds up several deductions against the same person', function () {
    $employee = make_trainee();

    foreach ([['Loan', 'loan', 1000], ['Advance', 'advance', 500]] as [$label, $kind, $amount]) {
        $this->actingAs(clerk())->post('/admin/payroll/adjustments', [
            'employee_id' => $employee->id,
            'label' => $label,
            'kind' => $kind,
            'amount' => $amount,
        ])->assertSessionHasNoErrors();
    }

    expect((new CalculatePayslip)($employee, ...month())['other_deductions'])->toBe(1500.0);
});

it('shows the deductions on the pay run and on the person', function () {
    $employee = make_trainee();
    PayrollAdjustment::create([
        'employee_id' => $employee->id,
        'label' => 'Emergency loan',
        'amount' => 1500,
    ]);

    $this->actingAs(clerk())->post('/admin/payroll', [
        'label' => 'Deductions run',
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
        'paid_on' => now()->endOfMonth()->toDateString(),
    ])->assertRedirect();

    $run = PayrollRun::where('label', 'Deductions run')->firstOrFail();
    $slip = $run->payslips()->where('employee_id', $employee->id)->firstOrFail();

    expect($slip->other_deductions)->toBe(1500.0);

    $props = $this->actingAs(clerk())
        ->get("/admin/hr/employees/{$employee->id}")
        ->viewData('page')['props'];

    expect($props['adjustments'])->toHaveCount(1)
        ->and($props['adjustments'][0]['label'])->toBe('Emergency loan');
});

it('keeps the books to staff with the permission', function () {
    $reception = User::where('email', 'reception@patrice.test')->firstOrFail();

    $this->actingAs($reception)->get('/admin/payroll/settings')->assertForbidden();
    $this->actingAs($reception)
        ->patch('/admin/payroll/settings', rates())
        ->assertForbidden();
    $this->actingAs($reception)
        ->post('/admin/payroll/adjustments', [
            'employee_id' => theNurse()->id,
            'label' => 'Not mine',
            'amount' => 100,
        ])
        ->assertForbidden();
});
