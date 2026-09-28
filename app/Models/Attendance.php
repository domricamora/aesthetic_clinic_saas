<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One day in for one person (plan.md §28). Payroll turns the overtime minutes
 * into pay, so a forgotten clock out is an exception someone can see.
 */
class Attendance extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['work_date' => 'date:Y-m-d',
            'minutes' => 'integer',
            'overtime_minutes' => 'integer',
        ];
    }

    /** @return BelongsTo<Employee, $this> */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isComplete(): bool
    {
        return $this->time_in !== null && $this->time_out !== null;
    }

    public function hours(): float
    {
        return round($this->minutes / 60, 2);
    }
}
