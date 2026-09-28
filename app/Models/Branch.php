<?php

namespace App\Models;

use App\Casts\AssetUrl;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $organization_id
 * @property string $name
 * @property string $slug
 * @property string|null $address
 * @property string|null $city
 * @property string|null $phone
 * @property string|null $email
 * @property bool $is_active
 */
#[Fillable(['organization_id', 'name', 'slug', 'address', 'city', 'phone', 'email', 'image', 'hours', 'map_url', 'is_active'])]
class Branch extends Model
{
    use BelongsToOrganization;

    /** @return BelongsToMany<Specialist, $this> */
    public function specialists(): BelongsToMany
    {
        return $this->belongsToMany(Specialist::class);
    }

    protected function casts(): array
    {
        return ['image' => AssetUrl::class, 'is_active' => 'boolean', 'hours' => 'array'];
    }
}
