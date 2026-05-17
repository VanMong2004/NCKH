<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ProductService;
use Illuminate\Support\Facades\Auth;

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
        try {

            $filters = $request->only([
                'keyword',

                'category_id',

                'min_price',
                'max_price',

                'sizes',
                'colors',

                'rating',

                'in_stock',

                'sort',

                'page',
                'per_page',
            ]);

            $result = $this->productService
                ->getList($filters);

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy danh sách sản phẩm',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }

    // =========================
    // DETAIL
    // =========================
    public function show(Request $request, $slug)
    {
        try {

            return response()->json(
                $this->productService->show(
                    $slug,
                    Auth::guard('sanctum')->user()
                )
            );

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => $e->getMessage(),

                'data'
                    => null,
            ], 400);
        }
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

    // =========================
    // RECENTLY VIEWED PRODUCTS
    // =========================
    public function recentlyViewed(Request $request)
    {
        try {

            $result = $this->productService
                ->recentlyViewed(
                    $request->user()
                );

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy recently viewed',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }
}