<?php

namespace App\Actions\Accounting;

use App\Models\PayrollRun;
use App\Models\User;

/**
 * Puts an approved pay run into the books (plan.md §24): what the month cost as
 * an expense, what is owed to the government and still to the staff, and then
 * the money leaving the till when it is paid.
 */
class PostPayroll
{
    public function __construct(private readonly PostEntry $entries) {}

    public function __invoke(PayrollRun $run, User $user): void
    {
        if ($run->posted_at) {
            return;
        }

        $payslips = $run->payslips()->get();
        $gross = round((float) $payslips->sum('gross'), 2);
        $net = round((float) $payslips->sum('net'), 2);
        $sss = round((float) $payslips->sum('sss'), 2);
        $philhealth = round((float) $payslips->sum('philhealth'), 2);
        $pagibig = round((float) $payslips->sum('pagibig'), 2);
        $tax = round((float) $payslips->sum('withholding_tax'), 2);
        $other = round((float) $payslips->sum('unpaid_deduction') + (float) $payslips->sum('other_deductions'), 2);

        $lines = [['account' => '5100', 'debit' => $gross, 'memo' => $run->label]];

        foreach ([['2100', $sss], ['2110', $philhealth], ['2120', $pagibig], ['2130', $tax]] as [$code, $amount]) {
            if ($amount > 0.01) {
                $lines[] = ['account' => $code, 'credit' => $amount, 'memo' => $run->label];
            }
        }

        if ($other > 0.01) {
            $lines[] = ['account' => '2200', 'debit' => $other, 'memo' => 'Leave and other deductions, '.$run->label];
        }

        $lines[] = ['account' => '2200', 'credit' => $net, 'memo' => $run->label];

        ($this->entries)($lines, [
            'entry_date' => $run->paid_on->toDateString(),
            'memo' => 'Payroll '.$run->label,
            'source_type' => 'payroll',
            'source_id' => $run->id,
        ], $user);
    }

    /** The money actually leaving the till on payday. */
    public function paid(PayrollRun $run, User $user): void
    {
        $net = round((float) $run->payslips()->sum('net'), 2);

        if ($net < 0.01) {
            return;
        }

        ($this->entries)([
            ['account' => '2200', 'debit' => $net, 'memo' => $run->label],
            ['account' => '1000', 'credit' => $net, 'memo' => 'Net pay, '.$run->label],
        ], [
            'entry_date' => $run->paid_on->toDateString(),
            'memo' => 'Net pay disbursed '.$run->label,
            'source_type' => 'payroll',
            'source_id' => $run->id.'-paid',
        ], $user);
    }
}
