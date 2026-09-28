<?php

namespace App\Models\Concerns;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tenant-owned data: every query is limited to the current organization and
 * new rows get its id. Use withoutGlobalScope('organization') for platform
 * admin views.
 *
 * @mixin Model
 */
trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            if ($organization = Organization::current()) {
                $builder->where($builder->qualifyColumn('organization_id'), $organization->id);
            }
        });

        static::creating(function (Model $model) {
            if ($model->getAttribute('organization_id') === null) {
                $model->setAttribute('organization_id', Organization::current()?->id);
            }
        });
    }

    /** @return BelongsTo<Organization, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
