<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'seller_id',
        'category_id',
        'title',
        'slug',
        'description',
        'price',
        'stock',
        'images',
        'bracelet_image_path',
        'status',
        'view_count',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'price' => 'decimal:2',
        ];
    }

    protected $appends = ['image_urls', 'bracelet_image_url'];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(Material::class, 'product_material');
    }

    public function colors(): BelongsToMany
    {
        return $this->belongsToMany(Color::class, 'product_color');
    }

    public function styleTags(): BelongsToMany
    {
        return $this->belongsToMany(StyleTag::class);
    }

    public function getImageUrlsAttribute(): array
    {
        return collect($this->images ?? [])
            ->map(fn ($path) => Storage::disk('public')->url($path))
            ->values()
            ->all();
    }

    public function getBraceletImageUrlAttribute(): ?string
    {
        return $this->bracelet_image_path
            ? Storage::disk('public')->url($this->bracelet_image_path)
            : ($this->image_urls[0] ?? null);
    }
}
