<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TaggingService;
use Illuminate\Http\Request;

class TaggingController extends Controller
{
    public function __construct(private TaggingService $taggingService) {}

    /**
     * Called while a seller is filling in the "add product" form - reads
     * their description and returns suggested category/materials/colors/
     * style tags for them to review before the product is created.
     */
    public function suggest(Request $request)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        $suggestion = $this->taggingService->suggest($data['title'] ?? '', $data['description']);

        return response()->json($suggestion);
    }
}
