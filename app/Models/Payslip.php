<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * What one person was paid for one period (plan.md §26). The figures are
 * frozen onto the row, so changing a rate later never rewrites history.
 */
class Payslip extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['days_paid' => 'float',
            'basic' => 'float',
            'allowance' => 'float',
            'commission' => 'float',
            'overtime' => 'float',
            'unpaid_deduction' => 'float',
            'gross' => 'float',
            'sss' => 'float',
            'philhealth' => 'float',
            'pagibig' => 'float',
            'withholding_tax' => 'float',
            'other_deductions' => 'float',
            'total_deductions' => 'float',
            'net' => 'float',
        ];
    }

    /** @return BelongsTo<PayrollRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** The lines that make up what is taken off before tax. */
    public function governmentDeductions(): float
    {
        return round($this->sss + $this->philhealth + $this->pagibig, 2);
    }
}
