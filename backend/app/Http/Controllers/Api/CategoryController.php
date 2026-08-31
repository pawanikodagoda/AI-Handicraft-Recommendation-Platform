<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;

class CategoryController extends Controller
{
    /**
     * Only categories that actually have something published - offering a
     * filter that can only ever return "no results" is just a dead end
     * for the shopper. A category reappears as soon as a seller lists in
     * it (sellers type the category freely when adding a product).
     */
    public function index()
    {
        return Category::whereHas('products', fn ($q) => $q->where('status', 'published'))
            ->orderBy('name')
            ->get();
    }
}
