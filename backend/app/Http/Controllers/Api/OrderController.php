<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->orders()->with('items')->latest()->paginate(10);
    }

    public function show(Request $request, Order $order)
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        return $order->load('items.product');
    }

    /**
     * Checkout: turns the customer's cart into an order (proposal 4.1
     * step 7). Phase 1 only supports cash-on-delivery / manual bank
     * transfer confirmation - no payment gateway yet (see proposal 7.2).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'payment_method' => ['required', 'in:cod,bank_transfer'],
            'shipping_name' => ['required', 'string', 'max:255'],
            'shipping_phone' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:1000'],
        ]);

        $cart = $request->user()->cart()->with('items.product')->first();

        if (! $cart || $cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => ['Your cart is empty.']]);
        }

        $order = DB::transaction(function () use ($cart, $data, $request) {
            $total = $cart->items->sum(fn ($item) => $item->product->price * $item->quantity);

            $order = $request->user()->orders()->create([
                ...$data,
                'total' => $total,
                'status' => 'pending',
            ]);

            foreach ($cart->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'seller_id' => $item->product->seller_id,
                    'product_title' => $item->product->title,
                    'quantity' => $item->quantity,
                    'price' => $item->product->price,
                ]);

                $item->product->decrement('stock', min($item->quantity, $item->product->stock));
            }

            $cart->items()->delete();

            return $order;
        });

        return response()->json($order->load('items'), 201);
    }
}
