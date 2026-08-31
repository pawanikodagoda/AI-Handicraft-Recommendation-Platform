<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->cart()->with('items.product')->firstOrCreate([]);
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $cart = $request->user()->cart()->firstOrCreate([]);

        $item = $cart->items()->where('product_id', $data['product_id'])->first();
        if ($item) {
            $item->increment('quantity', $data['quantity'] ?? 1);
        } else {
            $item = $cart->items()->create([
                'product_id' => $data['product_id'],
                'quantity' => $data['quantity'] ?? 1,
            ]);
        }

        return $item->load('product');
    }

    public function update(Request $request, CartItem $item)
    {
        abort_unless($item->cart->user_id === $request->user()->id, 403);

        $data = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);
        $item->update($data);

        return $item->load('product');
    }

    public function remove(Request $request, CartItem $item)
    {
        abort_unless($item->cart->user_id === $request->user()->id, 403);
        $item->delete();

        return response()->noContent();
    }
}
