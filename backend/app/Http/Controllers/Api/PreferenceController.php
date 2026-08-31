<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request)
    {
        return $request->user()->preference ?? new \stdClass;
    }

    /**
     * Saves answers to the optional onboarding questionnaire (colour,
     * material, style, budget, occasion). A customer can skip this
     * entirely - they just never call this endpoint.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'colors' => ['sometimes', 'array'],
            'colors.*' => ['string', 'max:100'],
            'materials' => ['sometimes', 'array'],
            'materials.*' => ['string', 'max:100'],
            'styles' => ['sometimes', 'array'],
            'styles.*' => ['string', 'max:100'],
        ]);

        $preference = $request->user()->preference()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $data
        );

        return $preference;
    }
}
