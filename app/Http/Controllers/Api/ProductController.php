<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ProductService;

class ProductController extends Controller
{
    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    // =========================
    // LIST + FILTER
    // =========================
    public function index(Request $request)
    {
        $filters = $request->only([
            'keyword',
            'category_id',
            'min_price',
            'max_price',
            'sort',
        ]);

        return response()->json(
            $this->productService->getList($filters)
        );
    }

    // =========================
    // DETAIL
    // =========================
    public function show($id)
    {
        return response()->json(
            $this->productService->getDetail($id)
        );
    }

    // =========================
    // VARIANTS
    // =========================
    public function variants($id)
    {
        return response()->json(
            $this->productService->getVariants($id)
        );
    }

    // =========================
    // REVIEWS
    // =========================
    public function reviews($id)
    {
        return response()->json(
            $this->productService->getReviews($id)
        );
    }
}