<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPreference extends Model
{
    protected $fillable = [
        'user_id',
        'colors',
        'materials',
        'styles',
        'occasion',
        'budget_min',
        'budget_max',
    ];

    protected function casts(): array
    {
        return [
            'colors' => 'array',
            'materials' => 'array',
            'styles' => 'array',
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
