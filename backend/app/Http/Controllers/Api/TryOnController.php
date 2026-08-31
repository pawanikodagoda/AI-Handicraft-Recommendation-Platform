<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\TryOnService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TryOnController extends Controller
{
    public function __construct(private TryOnService $tryOnService) {}

    /**
     * Customer uploads a hand/wrist photo for a chosen product and gets
     * back a composited preview (proposal section 5.3). Wrist detection
     * runs automatically; if it fails, the frontend can resend with
     * wrist_x1/y1/x2/y2 marking both edges of the wrist so the customer
     * can still complete the try-on manually.
     */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'hand_image' => ['required', 'image', 'max:8192'],
            'wrist_x1' => ['sometimes', 'numeric'],
            'wrist_y1' => ['sometimes', 'numeric'],
            'wrist_x2' => ['sometimes', 'numeric'],
            'wrist_y2' => ['sometimes', 'numeric'],
            'force_manual' => ['sometimes', 'boolean'],
            'mode' => ['sometimes', 'nullable', 'string'],
            'api_key' => ['sometimes', 'nullable', 'string'],
            'provider' => ['sometimes', 'nullable', 'string'],
        ]);

        $product = Product::findOrFail($data['product_id']);
        $braceletPath = $product->bracelet_image_path ?: ($product->images[0] ?? null);
        abort_unless($braceletPath, 422, 'This product has no image to try on.');

        $extraParams = collect($data)
            ->only(['wrist_x1', 'wrist_y1', 'wrist_x2', 'wrist_y2', 'force_manual', 'mode', 'api_key', 'provider'])
            ->all();

        $result = $this->tryOnService->generate(
            $request->file('hand_image'),
            Storage::disk('public')->path($braceletPath),
            $extraParams
        );

        return response()->json($result);
    }
}
