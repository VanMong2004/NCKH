<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;


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
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',

                'category_id' => 'nullable|integer',

                'min_price' => 'nullable|numeric|min:0',
                'max_price' => 'nullable|numeric|min:0',

                'sizes' => 'nullable',
                'colors' => 'nullable',

                'rating' => 'nullable|numeric|min:0|max:5',

                'in_stock' => 'nullable',

                'sort' => 'nullable|string|max:50',

                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ], [
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',

                'category_id.integer' => 'Danh mục sản phẩm không hợp lệ',

                'min_price.numeric' => 'Giá thấp nhất không hợp lệ',
                'min_price.min' => 'Giá thấp nhất không được nhỏ hơn 0',

                'max_price.numeric' => 'Giá cao nhất không hợp lệ',
                'max_price.min' => 'Giá cao nhất không được nhỏ hơn 0',

                'rating.numeric' => 'Đánh giá không hợp lệ',
                'rating.min' => 'Đánh giá không được nhỏ hơn 0',
                'rating.max' => 'Đánh giá không được lớn hơn 5',

                'sort.max' => 'Kiểu sắp xếp không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số sản phẩm mỗi trang không hợp lệ',
                'per_page.min' => 'Số sản phẩm mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $user = auth('sanctum')->user();

            $result = $this->productService->getList(
                $filters,
                $user
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc sản phẩm không hợp lệ',
                'errors' => $e->errors(),
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);

        } catch (QueryException $e) {
            Log::error('Get product list database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get product list system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    // =========================
    // DETAIL
    // =========================
    public function show(Request $request, $slug)
    {
        try {
            $request->merge([
                'slug' => $slug,
            ]);

            $data = $request->validate([
                'slug' => 'required|string|max:255',
            ], [
                'slug.required' => 'Đường dẫn sản phẩm không hợp lệ',
                'slug.string' => 'Đường dẫn sản phẩm không hợp lệ',
                'slug.max' => 'Đường dẫn sản phẩm không hợp lệ',
            ]);

            $result = $this->productService->show(
                $data['slug'],
                Auth::guard('sanctum')->user()
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đường dẫn sản phẩm không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Get product detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // =========================
    // VARIANTS
    // =========================
    public function variants(Request $request, $id)
    {
        try {
            $request->merge([
                'product_id' => $id,
            ]);

            $data = $request->validate([
                'product_id' => 'required|integer|min:1',
            ], [
                'product_id.required' => 'Sản phẩm không hợp lệ',
                'product_id.integer' => 'Sản phẩm không hợp lệ',
                'product_id.min' => 'Sản phẩm không hợp lệ',
            ]);

            $result = $this->productService->getVariants($data['product_id']);

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Get product variants system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // =========================
    // REVIEWS
    // =========================
    public function reviews(Request $request, $id)
    {
        try {
            $request->merge([
                'product_id' => $id,
            ]);

            $data = $request->validate([
                'product_id' => 'required|integer|min:1',
            ], [
                'product_id.required' => 'Sản phẩm không hợp lệ',
                'product_id.integer' => 'Sản phẩm không hợp lệ',
                'product_id.min' => 'Sản phẩm không hợp lệ',
            ]);

            $result = $this->productService->getReviews($data['product_id']);

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Get product reviews system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // =========================
    // RECENTLY VIEWED PRODUCTS
    // =========================
    public function recentlyViewed(Request $request)
    {
        try {
            $result = $this->productService->recentlyViewed(
                $request->user()
            );

            return response()->json($result);

        } catch (QueryException $e) {
            Log::error('Recently viewed database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Recently viewed system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}