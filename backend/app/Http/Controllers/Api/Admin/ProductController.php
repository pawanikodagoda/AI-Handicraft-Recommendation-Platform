<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        return Product::query()
            ->with(['seller:id,name,email', 'category'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->paginate(20);
    }

    public function updateStatus(Request $request, Product $product)
    {
        $data = $request->validate(['status' => ['required', 'in:draft,published']]);
        $product->update($data);

        return $product;
    }
}
