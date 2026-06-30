<?php

namespace App\Http\Controllers\Api\Admin;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminReviewService;
use Illuminate\Validation\ValidationException;

class AdminReviewController extends Controller
{
    public function __construct(
        protected AdminReviewService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'product_id' => 'nullable|integer|exists:products,id',
                'user_id' => 'nullable|integer|exists:users,id',
                'rating' => 'nullable|integer|min:1|max:5',
                'status' => 'nullable|in:visible,hidden,deleted,all',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'sort' => 'nullable|in:latest,oldest,highest,lowest',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            return response()->json(
                $this->service->index($filters)
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc review không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách review',
                'data' => null,
            ], 500);
        }
    }

    public function statistics()
    {
        try {
            return response()->json(
                $this->service->statistics()
            );
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy thống kê review',
                'data' => null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            return response()->json(
                $this->service->show((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết review',
                'data' => null,
            ], 500);
        }
    }

    public function hide($id)
    {
        try {
            return response()->json(
                $this->service->hide((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        }
    }

    public function showReview($id)
    {
        try {
            return response()->json(
                $this->service->showReview((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        }
    }

    public function destroy($id)
    {
        try {
            return response()->json(
                $this->service->destroy((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        }
    }

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
