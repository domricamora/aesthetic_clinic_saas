<?php

namespace App\Models;

use App\Casts\AssetUrl;
use App\Models\Concerns\BelongsToOrganization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A promo or package offer (plan.md §9, §36, §83). Copy stays modest: what is
 * included, until when, and what the client should ask about first.
 *
 * @property CarbonImmutable|null $ends_on
 */
class Promotion extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['image' => AssetUrl::class,
            'details' => 'array',
            'ends_on' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<Treatment, $this> */
    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }
}
