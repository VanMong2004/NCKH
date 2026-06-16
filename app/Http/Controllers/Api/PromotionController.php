<?php

namespace App\Http\Controllers\Api;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\PromotionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PromotionController extends Controller
{
    public function __construct(
        protected PromotionService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => 'nullable|in:upcoming,active,ended',
                'sort' => 'nullable|in:latest,ending_soon,popular',
                'per_page' => 'nullable|integer|min:1|max:50',
                'page' => 'nullable|integer|min:1',
            ]);

            $result = $this->service->index($filters);

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc khuyến mãi không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (Throwable $e) {
            Log::error('Promotion index error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show($slug): JsonResponse
    {
        try {
            $result = $this->service->show($slug);

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết khuyến mãi thành công',
                'data' => $result,
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Promotion show error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function products(Request $request, $slug): JsonResponse
    {
        try {
            $filters = $request->validate([
                'per_page' => 'nullable|integer|min:1|max:50',
                'page' => 'nullable|integer|min:1',
            ]);

            $user = auth('sanctum')->user();

            $result = $this->service->products(
                $slug,
                $filters,
                $user
            );

            return response()->json($result);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Promotion products error', [
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