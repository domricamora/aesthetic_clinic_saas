<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Time off asked for and what came of it (plan.md §28). */
class LeaveRequest extends Model
{
    use BelongsToOrganization;

    public const TYPES = [
        'annual' => 'Annual leave',
        'sick' => 'Sick leave',
        'unpaid' => 'Unpaid leave',
        'maternity' => 'Maternity',
        'other' => 'Other',
    ];

    public const STATUSES = [
        'pending' => 'Pending',
        'approved' => 'Approved',
        'declined' => 'Declined',
        'cancelled' => 'Cancelled',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['from_date' => 'date:Y-m-d',
            'to_date' => 'date:Y-m-d',
            'days' => 'float',
            'reviewed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** @param  Builder<LeaveRequest>  $query */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', 'approved');
    }

    /** @param  Builder<LeaveRequest>  $query */
    public function scopePending(Builder $query): void
    {
        $query->where('status', 'pending');
    }

    /** Days of paid leave already approved this calendar year. */
    public function paidDaysTakenIn(int $year): float
    {
        return round((float) $this->leaves()
            ->approved()
            ->whereIn('type', ['annual', 'sick'])
            ->whereYear('from_date', $year)
            ->sum('days'), 2);
    }
}
