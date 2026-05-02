<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with([
            'category',
            'variants',
            'images',
        ])
            ->where('is_active', 1)
            ->orderByDesc('id')
            ->get();

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with([
            'category',
            'variants',
            'images',
            'reviews',
        ])
            ->where('is_active', 1)
            ->findOrFail($id);

        return response()->json($product);
    }
}