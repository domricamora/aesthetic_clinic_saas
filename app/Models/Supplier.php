<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A supplier stock is received from (plan.md §21, §23). */
class Supplier extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<ProductBatch, $this> */
    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class);
    }
}
