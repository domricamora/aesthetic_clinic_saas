<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One pay run over a period (plan.md §26): draft, approved, then paid. */
class PayrollRun extends Model
{
    use BelongsToOrganization;

    public const STATUSES = [
        'draft' => 'Draft',
        'approved' => 'Approved',
        'paid' => 'Paid',
        'cancelled' => 'Cancelled',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['period_start' => 'date:Y-m-d',
            'period_end' => 'date:Y-m-d',
            'paid_on' => 'date:Y-m-d',
            'total_gross' => 'float',
            'total_deductions' => 'float',
            'total_net' => 'float',
            'approved_at' => 'datetime',
            'posted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function preparer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasMany<Payslip, $this> */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isPostable(): bool
    {
        return $this->status !== 'cancelled';
    }

    /** Rolls the payslip totals up so a list does not have to sum them. */
    public function recalculate(): void
    {
        $this->update([
            'total_gross' => round((float) $this->payslips()->sum('gross'), 2),
            'total_deductions' => round((float) $this->payslips()->sum('total_deductions'), 2),
            'total_net' => round((float) $this->payslips()->sum('net'), 2),
        ]);
    }
}
