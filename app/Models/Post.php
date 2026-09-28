<?php

namespace App\Models;

use App\Casts\AssetUrl;
use App\Models\Concerns\BelongsToOrganization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * A clinic journal article: general guidance only, never a medical claim
 * (plan.md §83). Body is plain text, one paragraph per blank line.
 *
 * @property CarbonImmutable|null $published_at
 */
class Post extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['image' => AssetUrl::class,
            'takeaways' => 'array',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /** @return list<string> */
    public function paragraphs(): array
    {
        return array_values(array_filter(array_map('trim', preg_split('/\n\s*\n/', (string) $this->body) ?: [])));
    }
}
