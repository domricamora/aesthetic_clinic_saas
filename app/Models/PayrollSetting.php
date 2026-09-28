<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;

/**
 * What this clinic deducts, and how (plan.md §26). The config file supplies
 * the defaults; this is where the office changes them, so a circular that moves
 * a ceiling is an edit in the office rather than a deployment.
 *
 * These are rates for going forward. A payslip already calculated keeps the
 * figures it was paid, so changing a rate never rewrites history.
 */
class PayrollSetting extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'sss_rate' => 'float',
            'sss_ceiling' => 'float',
            'sss_max' => 'float',
            'philhealth_rate' => 'float',
            'philhealth_ceiling' => 'float',
            'philhealth_max' => 'float',
            'pagibig_rate' => 'float',
            'pagibig_ceiling' => 'float',
            'pagibig_max' => 'float',
            'effective_from' => 'date:Y-m-d',
        ];
    }

    /**
     * The three contributions as a calculator wants them, falling back to the
     * config default for anything this clinic has not overridden.
     *
     * @return array<string, array{employee_rate: float, monthly_salary_ceiling: float, maximum_contribution: float}>
     */
    public function contributions(): array
    {
        $rates = [];

        foreach (['sss', 'philhealth', 'pagibig'] as $key) {
            $rates[$key] = [
                'employee_rate' => (float) $this->{$key.'_rate'},
                'monthly_salary_ceiling' => (float) $this->{$key.'_ceiling'},
                'maximum_contribution' => (float) $this->{$key.'_max'},
            ];
        }

        return $rates;
    }

    /** The clinic's own row, or the defaults when they have never changed them. */
    public static function current(): self
    {
        $settings = static::query()->first();

        if ($settings) {
            return $settings;
        }

        $defaults = new static;
        $defaults->sss_rate = config('payroll.sss.employee_rate');
        $defaults->sss_ceiling = config('payroll.sss.monthly_salary_ceiling');
        $defaults->sss_max = config('payroll.sss.maximum_contribution');
        $defaults->philhealth_rate = config('payroll.philhealth.employee_rate');
        $defaults->philhealth_ceiling = config('payroll.philhealth.monthly_salary_ceiling');
        $defaults->philhealth_max = config('payroll.philhealth.maximum_contribution');
        $defaults->pagibig_rate = config('payroll.pagibig.employee_rate');
        $defaults->pagibig_ceiling = config('payroll.pagibig.monthly_salary_ceiling');
        $defaults->pagibig_max = config('payroll.pagibig.maximum_contribution');

        return $defaults;
    }
}
