<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Accounting\PostPayroll;
use App\Actions\Payroll\CalculatePayslip;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PayrollRun;
use App\Models\Payslip;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        return back()->with('success', $run->label.' approved and posted to the books.');
    }

    public function pay(PayrollRun $run, PostPayroll $post): RedirectResponse
    {
        if ($run->status !== 'approved') {
            throw ValidationException::withMessages(['status' => 'Approve the run before paying it.']);
        }

        $post->paid($run, request()->user());
        $run->update(['status' => 'paid']);

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
