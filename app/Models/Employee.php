<?php

namespace App\Models;

use App\Casts\AssetUrl;
use App\Models\Concerns\BelongsToOrganization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A person on the payroll (plan.md §26, §28). The pay details live here, not
 * on the sign-in, so staff who never log in still get paid.
 */
class Employee extends Model
{
    use BelongsToOrganization;

    public const TYPES = [
        'regular' => 'Regular',
        'probationary' => 'Probationary',
        'contractual' => 'Contractual',
        'part_time' => 'Part-time',
        'intern' => 'Intern',
    ];

    public const SCHEDULES = [
        'monthly' => 'Monthly',
        'semi_monthly' => 'Semi-monthly',
    ];

    public const STATUSES = [
        'active' => 'Active',
        'on_leave' => 'On leave',
        'resigned' => 'Resigned',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['hire_date' => 'date:Y-m-d',
            'resigned_on' => 'date:Y-m-d',
            'base_salary' => 'float',
            'monthly_allowance' => 'float',
            'practitioner' => 'boolean',
            'photo' => AssetUrl::class,
            'show_on_site' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return HasMany<Attendance, $this> */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /** @return HasMany<LeaveRequest, $this> */
    public function leaves(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /** @return HasMany<Payslip, $this> */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    /** @param  Builder<Employee>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', '!=', 'resigned');
    }

    /** @param  Builder<Employee>  $query */
    public function scopeEmployedOn(Builder $query, CarbonImmutable|string $date): void
    {
        $date = $date instanceof CarbonImmutable ? $date->toDateString() : $date;
        $query->whereDate('hire_date', '<=', $date)
            // Someone who left on the first day of the period is not on it.
            ->where(fn (Builder $q) => $q->whereNull('resigned_on')->orWhereDate('resigned_on', '>', $date));
    }

    /**
     * The stored path, not the served URL. The cast turns the stored path into
     * a URL on the way out, so anything that has to find the file on disk to
     * delete it needs the original.
     */
    public function photoPath(): ?string
    {
        return $this->getRawOriginal('photo');
    }

    /** What they take home before anything is taken off, per month. */
    public function grossMonthly(): float
    {
        return round($this->base_salary + $this->monthly_allowance, 2);
    }

    /** A day at the standard rate, used for overtime and unpaid leave. */
    public function dailyRate(): float
    {
        return round($this->base_salary / 22, 2);
    }

    public function hourlyRate(): float
    {
        return round($this->dailyRate() / 8, 2);
    }

    public function isActive(): bool
    {
        return $this->status !== 'resigned';
    }
}
