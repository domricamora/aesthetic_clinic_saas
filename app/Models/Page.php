<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * Long form policy copy (privacy, terms, data privacy notice) held as sections
 * so a clinic can edit it without a deploy. Sections are rendered as text, so
 * nothing here can inject markup into the page.
 *
 * @property list<array{heading: string, paragraphs: list<string>}> $sections
 * @property CarbonImmutable|null $reviewed_on
 */
class Page extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['sections' => 'array', 'reviewed_on' => 'date'];
    }
}
