<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A deduction that is not the government: a loan, a salary advance, a
 * garnishment (plan.md §26). With no period it comes off every run until it is
 * cleared; with a period it comes off that one run.
 */
class PayrollAdjustment extends Model
{
    use BelongsToOrganization;

    public const KINDS = [
        'loan' => 'Loan repayment',
        'advance' => 'Salary advance',
        'other' => 'Other deduction',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['amount' => 'float', 'is_active' => 'boolean'];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * The ones that come off a given period, and what they add up to.
     *
     * @return array{lines: Collection<int, self>, total: float}
     */
    public static function forPeriod(Employee $employee, string $period): array
    {
        $lines = static::query()
            ->where('employee_id', $employee->id)
            ->where('is_active', true)
            ->where(fn (Builder $q) => $q->whereNull('period')->orWhere('period', $period))
            ->get();

        return ['lines' => $lines, 'total' => round((float) $lines->sum('amount'), 2)];
    }
}
