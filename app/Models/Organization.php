<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 */
#[Fillable(['name', 'slug'])]
class Organization extends Model
{
    /**
     * The tenant for this request: the signed-in user's organization, else the
     * clinic the public site belongs to (config clinic.organization).
     */
    public static function current(): ?self
    {
        // Read the signed-in user every time so an early lookup (before auth) can never pin the wrong tenant.
        $user = Auth::user();

        if ($user instanceof User && $user->organization_id !== null) {
            return $user->organization;
        }

        return app()->bound('organization.default') ? app('organization.default') : null;
    }

    /** @return HasMany<Branch, $this> */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
