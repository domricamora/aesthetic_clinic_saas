<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Accounting\PostPayroll;
use App\Actions\Payroll\CalculatePayslip;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\PayrollAdjustment;
use App\Models\PayrollRun;
use App\Models\PayrollSetting;
use App\Models\Payslip;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pay runs and payslips (plan.md §26). A run is calculated from the employee
 * records, reviewed, approved, and only then does it reach the books.
 */
class PayrollController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/payroll/index', [
            'runs' => PayrollRun::with('preparer:id,name')
                ->withCount('payslips')
                ->orderByDesc('period_start')
                ->get()
                ->map(fn (PayrollRun $r) => [
                    'id' => $r->id,
                    'label' => $r->label,
                    'period_start' => $r->period_start->toDateString(),
                    'period_end' => $r->period_end->toDateString(),
                    'paid_on' => $r->paid_on->toDateString(),
                    'status' => $r->status,
                    'headcount' => $r->payslips_count,
                    'total_gross' => $r->total_gross,
                    'total_net' => $r->total_net,
                ]),
            'statuses' => PayrollRun::STATUSES,
            'staff' => Employee::active()->count(),
            'monthly_payroll' => round((float) Employee::active()->sum('base_salary') + (float) Employee::active()->sum('monthly_allowance'), 2),
        ]);
    }

    /** Builds a run: one payslip per person employed during the period. */
    /**
     * What the clinic deducts, editable by the office (plan.md §26).
     *
     * The defaults come from config/payroll.php and are a starting point,
     * not advice: contribution ceilings move with law, and a payroll
     * specialist should check them before a real run.
     */
    public function settings(): Response
    {
        $settings = PayrollSetting::current();

        return Inertia::render('admin/payroll/settings', [
            'settings' => [
                'sss_rate' => $settings->sss_rate,
                'sss_ceiling' => $settings->sss_ceiling,
                'sss_max' => $settings->sss_max,
                'philhealth_rate' => $settings->philhealth_rate,
                'philhealth_ceiling' => $settings->philhealth_ceiling,
                'philhealth_max' => $settings->philhealth_max,
                'pagibig_rate' => $settings->pagibig_rate,
                'pagibig_ceiling' => $settings->pagibig_ceiling,
                'pagibig_max' => $settings->pagibig_max,
                'effective_from' => $settings->effective_from?->toDateString(),
                'configured' => PayrollSetting::query()->exists(),
            ],
            'defaults' => [
                'sss_rate' => (float) config('payroll.sss.employee_rate'),
                'philhealth_rate' => (float) config('payroll.philhealth.employee_rate'),
                'pagibig_rate' => (float) config('payroll.pagibig.employee_rate'),
            ],
            'kinds' => PayrollAdjustment::KINDS,
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sss_rate' => ['required', 'numeric', 'between:0,1'],
            'sss_ceiling' => ['required', 'numeric', 'min:0', 'max:10000000'],
            'sss_max' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'philhealth_rate' => ['required', 'numeric', 'between:0,1'],
            'philhealth_ceiling' => ['required', 'numeric', 'min:0', 'max:10000000'],
            'philhealth_max' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'pagibig_rate' => ['required', 'numeric', 'between:0,1'],
            'pagibig_ceiling' => ['required', 'numeric', 'min:0', 'max:10000000'],
            'pagibig_max' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'effective_from' => ['nullable', 'date'],
        ], [
            '*.rate.between' => 'A rate is a share of the salary, so between 0 and 1 (5% is 0.05).',
        ]);

        PayrollSetting::updateOrCreate(
            ['organization_id' => $request->user()->organization_id],
            $data,
        );

        return back()->with('success', 'Contribution rates updated. Payslips already paid keep the figures they were paid.');
    }

    /**
     * A loan, an advance, a garnishment: recorded once, then taken off every
     * run until it is cleared, or off one named period.
     */
    public function storeAdjustment(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', Rule::exists('employees', 'id')],
            'label' => ['required', 'string', 'max:120'],
            'kind' => ['required', Rule::in(array_keys(PayrollAdjustment::KINDS))],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'period' => ['nullable', 'string', 'regex:/^\d{4}-\d{2}$/'],
            'note' => ['nullable', 'string', 'max:200'],
        ], [
            'period.regex' => 'Give a period as YYYY-MM, or leave it blank for every run.',
        ]);

        PayrollAdjustment::create($data);

        return back()->with('success', $data['label'].' will be deducted from the next pay run.');
    }

    public function clearAdjustment(PayrollAdjustment $adjustment): RedirectResponse
    {
        $adjustment->update(['is_active' => false]);

        return back()->with('success', $adjustment->label.' cleared. It stays on the record.');
    }

    public function store(Request $request, CalculatePayslip $calculate): RedirectResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:60'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'paid_on' => ['required', 'date', 'after_or_equal:period_end'],
        ]);

        $from = CarbonImmutable::parse($data['period_start']);
        $to = CarbonImmutable::parse($data['period_end']);

        $run = PayrollRun::create([
            'user_id' => $request->user()->id,
            'label' => $data['label'],
            'period_start' => $data['period_start'],
            'period_end' => $data['period_end'],
            'paid_on' => $data['paid_on'],
            'status' => 'draft',
        ]);

        foreach (Employee::employedOn($from)->active()->get() as $employee) {
            Payslip::create($calculate($employee, $from, $to) + [
                'payroll_run_id' => $run->id,
                'employee_id' => $employee->id,
            ]);
        }

        $run->recalculate();

        return redirect()->to(route('admin.payroll.show', $run))
            ->with('success', $run->payslips()->count().' payslips calculated.');
    }

    public function show(PayrollRun $run): Response
    {
        $payslips = $run->payslips()->with('employee:id,name,position')->orderBy('employee_id')->get();

        return Inertia::render('admin/payroll/run', [
            'run' => [
                'id' => $run->id,
                'label' => $run->label,
                'period_start' => $run->period_start->toDateString(),
                'period_end' => $run->period_end->toDateString(),
                'paid_on' => $run->paid_on->toDateString(),
                'status' => $run->status,
                'preparer' => $run->preparer?->name,
                'total_gross' => $run->total_gross,
                'total_deductions' => $run->total_deductions,
                'total_net' => $run->total_net,
                'approved_at' => $run->approved_at?->toIso8601String(),
                'posted_at' => $run->posted_at?->toIso8601String(),
            ],
            'payslips' => $payslips->map(fn (Payslip $p) => [
                'id' => $p->id,
                'employee' => $p->employee->name,
                'position' => $p->employee->position,
                'days_paid' => $p->days_paid,
                'basic' => $p->basic,
                'overtime' => $p->overtime,
                'commission' => $p->commission,
                'gross' => $p->gross,
                'sss' => $p->sss,
                'philhealth' => $p->philhealth,
                'pagibig' => $p->pagibig,
                'withholding_tax' => $p->withholding_tax,
                'unpaid_deduction' => $p->unpaid_deduction,
                'other_deductions' => $p->other_deductions,
                'net' => $p->net,
            ]),
            'totals' => [
                'sss' => round((float) $payslips->sum('sss'), 2),
                'philhealth' => round((float) $payslips->sum('philhealth'), 2),
                'pagibig' => round((float) $payslips->sum('pagibig'), 2),
                'withholding_tax' => round((float) $payslips->sum('withholding_tax'), 2),
                'overtime' => round((float) $payslips->sum('overtime'), 2),
            ],
            'statuses' => PayrollRun::STATUSES,
        ]);
    }

    /** Approval is the gate: only an approved run is posted to the books. */
    public function approve(PayrollRun $run, PostPayroll $post): RedirectResponse
    {
        if ($run->status !== 'draft') {
            throw ValidationException::withMessages(['status' => 'Only a draft run can be approved.']);
        }

        $post($run, request()->user());

        $run->update(['status' => 'approved', 'approved_at' => now(), 'posted_at' => now()]);

        // The gate before real money leaves the books, and the last moment
        // somebody could still have stopped it.
        AuditLog::record(
            'payroll.approve',
            $run->label.' approved and posted to the books.',
            $run,
            [
                'gross' => $run->gross,
                'deductions' => $run->total_deductions,
                'net' => $run->net,
                'payslips' => $run->payslips()->count(),
            ],
        );

        return back()->with('success', $run->label.' approved and posted to the books.');
    }

    public function pay(PayrollRun $run, PostPayroll $post): RedirectResponse
    {
        if ($run->status !== 'approved') {
            throw ValidationException::withMessages(['status' => 'Approve the run before paying it.']);
        }

        $post->paid($run, request()->user());
        $run->update(['status' => 'paid']);

        AuditLog::record(
            'payroll.pay',
            $run->label.' marked as paid.',
            $run,
            ['net' => $run->net, 'payslips' => $run->payslips()->count()],
        );

        return back()->with('success', $run->label.' marked as paid.');
    }

    /** A payslip on its own, the way the person receives it. */
    public function payslip(Payslip $payslip): Response
    {
        $payslip->load(['employee:id,name,position', 'run:id,label,period_start,period_end,paid_on,status']);
        $employee = $payslip->employee;
        $run = $payslip->run;

        return Inertia::render('admin/payroll/payslip', [
            'payslip' => [
                'id' => $payslip->id,
                'label' => $run->label,
                'period' => $run->period_start->format('j M Y').' - '.$run->period_end->format('j M Y'),
                'paid_on' => $run->paid_on->toDateString(),
                'status' => $run->status,
                'employee' => $employee->name,
                'position' => $employee->position,
                'employee_no' => $employee->employee_no,
                'days_paid' => $payslip->days_paid,
                'basic' => $payslip->basic,
                'allowance' => $payslip->allowance,
                'commission' => $payslip->commission,
                'overtime' => $payslip->overtime,
                'gross' => $payslip->gross,
                'sss' => $payslip->sss,
                'philhealth' => $payslip->philhealth,
                'pagibig' => $payslip->pagibig,
                'withholding_tax' => $payslip->withholding_tax,
                'unpaid_deduction' => $payslip->unpaid_deduction,
                'other_deductions' => $payslip->other_deductions,
                'total_deductions' => $payslip->total_deductions,
                'net' => $payslip->net,
            ],
        ]);
    }
}
