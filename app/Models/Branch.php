<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

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
#[Fillable(['organization_id', 'name', 'slug', 'address', 'city', 'phone', 'email', 'is_active'])]
class Branch extends Model
{
    use BelongsToOrganization;

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
