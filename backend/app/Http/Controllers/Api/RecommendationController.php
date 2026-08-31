<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\RecommendationService;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(private RecommendationService $recommendationService) {}

    /**
     * Personalized homepage feed (proposal section 4.1 step 3). If the
     * customer is logged in and completed the preference questionnaire,
     * results are ranked to match their taste; otherwise this falls back
     * to a recency/popularity ordering so guests still see something
     * useful.
     */
    public function index(Request $request)
    {
        $candidates = Product::query()
            ->where('status', 'published')
            ->with(['category', 'materials', 'colors', 'styleTags', 'seller:id,name'])
            ->latest()
            ->limit(200)
            ->get();

        if ($candidates->isEmpty()) {
            return response()->json(['personalized' => false, 'data' => []]);
        }

        // No auth:sanctum middleware on this route (guests must still get a
        // feed), so the default guard won't resolve a Bearer token here -
        // the sanctum guard has to be requested explicitly.
        $preference = $request->user('sanctum')?->preference;
        $perPage = min((int) $request->integer('per_page', 12), 50);

        $ranked = $this->recommendationService->rank($candidates, $preference, limit: 100);

        $byId = $candidates->keyBy('id');
        $ordered = collect($ranked)
            ->map(fn ($row) => $byId->get($row['id']))
            ->filter()
            ->values();

        $page = max((int) $request->integer('page', 1), 1);
        $items = $ordered->forPage($page, $perPage)->values();

        return response()->json([
            'personalized' => (bool) $preference,
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $ordered->count(),
        ]);
    }
}
