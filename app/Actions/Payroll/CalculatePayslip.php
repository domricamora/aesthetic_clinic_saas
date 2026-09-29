<?php

namespace App\Actions\Payroll;

use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\PayrollAdjustment;
use App\Models\PayrollSetting;
use Carbon\CarbonImmutable;

/**
 * Works out one payslip (plan.md §26) from the employee record, the clock-in
 * log and approved leave. Every rate comes from config/payroll.php, and the
 * result is stored on the payslip so a later rate change never rewrites what
 * was actually paid.
 *
 * Contribution ceilings and the withholding table are law that moves; have a
 * payroll specialist check the config before a real run (plan.md §26).
 */
class CalculatePayslip
{
    /**
     * @param  array<string, float>  $adjustments  commission and other deductions
     * @return array<string, float>
     */
    public function __invoke(Employee $employee, CarbonImmutable $from, CarbonImmutable $to, array $adjustments = []): array
    {
        $workingDays = $this->workingDays($from, $to);
        $unpaidLeave = $this->unpaidLeaveDays($employee, $from, $to);
        $daysPaid = max(0, round($workingDays - $unpaidLeave, 2));

        // A monthly salary is paid in full for a full month; a part period, or
        // a month with unpaid leave, is pro-rated on the days actually worked.
        $prorated = $workingDays > 0 ? $daysPaid / $workingDays : 0;
        $base = $employee->pay_schedule === 'semi_monthly'
            ? round($employee->base_salary / 2, 2)
            : round($employee->base_salary * $prorated, 2);
        $allowance = round($employee->monthly_allowance * $prorated, 2);

        $overtimeMinutes = (int) $employee->attendances()
            ->whereBetween('work_date', [$from->toDateString(), $to->toDateString()])
            ->sum('overtime_minutes');
        $overtime = round($overtimeMinutes / 60 * $employee->hourlyRate(), 2);

        $commission = round((float) ($adjustments['commission'] ?? 0), 2);
        // Loans, advances and the rest come off the employee's own record, so
        // the office records a loan once rather than every month.
        $standing = PayrollAdjustment::forPeriod($employee, $from->format('Y-m'));
        $otherDeductions = round((float) ($adjustments['other_deductions'] ?? 0) + $standing['total'], 2);
        $unpaidDeduction = round($unpaidLeave * $employee->dailyRate(), 2);

        $gross = round($base + $allowance + $overtime + $commission, 2);
        $taxable = max(0, $gross - $unpaidDeduction);
        $monthlyEquivalent = $this->monthlyEquivalent($employee, $base, $from, $to);
        $this->employeeRates = $employee->statutoryRates();

        $sss = $this->contribution('sss', $monthlyEquivalent);
        $philhealth = $this->contribution('philhealth', $monthlyEquivalent);
        $pagibig = $this->contribution('pagibig', $monthlyEquivalent);
        $withholding = $this->withholding($employee, $employee->pay_schedule === 'semi_monthly' ? $taxable * 2 : $taxable);

        $deductions = round($sss + $philhealth + $pagibig + $withholding + $unpaidDeduction + $otherDeductions, 2);

        return [
            'days_paid' => $daysPaid,
            'basic' => $base,
            'allowance' => $allowance,
            'commission' => $commission,
            'overtime' => $overtime,
            'unpaid_deduction' => $unpaidDeduction,
            'gross' => $gross,
            'sss' => $sss,
            'philhealth' => $philhealth,
            'pagibig' => $pagibig,
            'withholding_tax' => $withholding,
            'other_deductions' => $otherDeductions,
            'total_deductions' => $deductions,
            'net' => round($gross - $deductions, 2),
        ];
    }

    /** Weekdays in the period: nobody is paid for the weekend. */
    private function workingDays(CarbonImmutable $from, CarbonImmutable $to): float
    {
        $days = 0;
        $cursor = $from;

        while ($cursor->lessThanOrEqualTo($to)) {
            $days += $cursor->isWeekend() ? 0 : 1;
            $cursor = $cursor->addDay();
        }

        return (float) $days;
    }

    /** Approved unpaid leave inside the period; paid leave is not deducted. */
    private function unpaidLeaveDays(Employee $employee, CarbonImmutable $from, CarbonImmutable $to): float
    {
        return round((float) LeaveRequest::where('employee_id', $employee->id)
            ->approved()
            ->where('type', 'unpaid')
            ->whereDate('from_date', '<=', $to->toDateString())
            ->whereDate('to_date', '>=', $from->toDateString())
            ->sum('days'), 2);
    }

    /** Contributions are on a monthly salary, so a half month still credits a month. */
    private function monthlyEquivalent(Employee $employee, float $basic, CarbonImmutable $from, CarbonImmutable $to): float
    {
        if ($employee->pay_schedule === 'semi_monthly') {
            return round($basic * 2, 2);
        }

        $days = $this->workingDays($from, $to);

        return $days > 0 ? round($basic * 22 / $days, 2) : $basic;
    }

    /**
     * The clinic's own rates, so a circular that moves a ceiling is an edit in
     * the office rather than a deployment (plan.md §26).
     *
     * @var array<string, array{employee_rate: float, monthly_salary_ceiling: float, maximum_contribution: float}>|null
     */
    private ?array $rates = null;

    /**
     * @return array<string, array{employee_rate: float, monthly_salary_ceiling: float, maximum_contribution: float}>
     */
    private function contributions(): array
    {
        return $this->rates ??= PayrollSetting::current()->contributions();
    }

    private function contribution(string $key, float $monthlySalary): float
    {
        $settings = $this->contributions()[$key];
        // A rate on the person beats the clinic's, for the ones the clinic
        // default is wrong about.
        $rate = $this->employeeRates[$key] ?? $settings['employee_rate'];
        $creditable = min($monthlySalary, $settings['monthly_salary_ceiling']);
        $contribution = $creditable * $rate;

        return round(min($contribution, $settings['maximum_contribution']), 2);
    }

    /**
     * This person's rates, resolved once so every line and the withholding all
     * read from the same answer.
     *
     * @var array<string, float>
     */
    private array $employeeRates = [];

    /**
     * Withholding for one person: nothing if they are exempt, a flat rate if
     * one was set for them, otherwise the TRAIN band table.
     */
    private function withholding(Employee $employee, float $monthlyTaxable): float
    {
        if ($employee->tax_exempt) {
            return 0.0;
        }

        if ($employee->withholding_rate !== null) {
            return round($monthlyTaxable * (float) $employee->withholding_rate, 2);
        }

        return $this->withholdingTax($monthlyTaxable);
    }

    /**
     * The TRAIN monthly table from config. The bands are marginal: the first
     * peso above each floor is taxed at that band's rate, not the whole salary
     * at the rate of the band it lands in.
     */
    private function withholdingTax(float $monthlyTaxable): float
    {
        $tax = 0.0;
        $floor = 0.0;

        foreach (config('payroll.withholding_tax') as $band) {
            $ceiling = $band['up_to'] === null ? $monthlyTaxable : min($monthlyTaxable, $band['up_to']);
            $tax += max(0, $ceiling - $floor) * $band['rate'];

            if ($monthlyTaxable <= (float) $band['up_to']) {
                break;
            }

            $floor = (float) $band['up_to'];
        }

        return round($tax, 2);
    }
}
