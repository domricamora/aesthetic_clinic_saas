<?php

namespace App\Models;

use App\Casts\AssetUrl;
use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Treatment extends Model
{
    use BelongsToOrganization;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['image' => AssetUrl::class,
            'price' => 'float',
            'promo_price' => 'float',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<TreatmentCategory, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(TreatmentCategory::class, 'treatment_category_id');
    }

    /** @return HasMany<SaleItem, $this> */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * What the register charges today: the promo price when there is one.
     */
    public function currentPrice(): float
    {
        return (float) ($this->promo_price ?: $this->price);
    }

    public function isOnPromo(): bool
    {
        return (float) $this->promo_price > 0 && (float) $this->promo_price < (float) $this->price;
    }

    /**
     * The stored path, not the public url.
     *
     * The image is cast to a url for the site, but the office needs the path on
     * disk to know which file a new upload replaces and which one a deleted
     * one removes.
     */
    public function imagePath(): ?string
    {
        return $this->getRawOriginal('image');
    }
}
