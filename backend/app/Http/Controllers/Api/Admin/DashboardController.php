<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        return [
            'total_customers' => User::where('role', 'customer')->count(),
            'total_sellers' => User::where('role', 'seller')->count(),
            'total_products' => Product::count(),
            'published_products' => Product::where('status', 'published')->count(),
            'pending_products' => Product::where('status', 'draft')->count(),
            'total_orders' => Order::count(),
            'total_revenue' => Order::whereIn('status', ['confirmed', 'shipped', 'completed'])->sum('total'),
        ];
    }
}
