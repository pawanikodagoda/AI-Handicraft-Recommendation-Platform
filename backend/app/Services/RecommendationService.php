<?php

namespace App\Services;

use App\Models\CustomerPreference;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Http;

class RecommendationService
{
    /**
     * Rank the given products against a customer's preferences (or, if no
     * preferences are given, fall back to recency/popularity server-side).
     *
     * @param  Collection<int, \App\Models\Product>  $products
     * @return array<int, array{id: int, score: float}>
     */
    public function rank(Collection $products, ?CustomerPreference $preference, int $limit = 50): array
    {
        $payload = [
            'products' => $products->map(fn ($p) => [
                'id' => $p->id,
                'price' => (float) $p->price,
                'colors' => $p->colors->pluck('name')->all(),
                'materials' => $p->materials->pluck('name')->all(),
                'style_tags' => $p->styleTags->pluck('name')->all(),
                'created_at' => $p->created_at?->toIso8601String(),
                'popularity_score' => (float) $p->view_count,
            ])->values()->all(),
            'limit' => $limit,
        ];

        if ($preference) {
            $payload['preferences'] = [
                'colors' => $preference->colors ?? [],
                'materials' => $preference->materials ?? [],
                'styles' => $preference->styles ?? [],
            ];
        }

        $response = Http::baseUrl(config('services.recommendation_service.url'))
            ->timeout(10)
            ->post('/recommend', $payload);

        $response->throw();

        return $response->json('ranked_product_ids', []);
    }
}
