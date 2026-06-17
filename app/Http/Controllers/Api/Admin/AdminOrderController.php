<?php

namespace App\Http\Controllers\Api\Admin;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminOrderService;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    public function __construct(
        protected AdminOrderService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|max:50',
                'payment_status' => 'nullable|string|max:50',
                'keyword' => 'nullable|string|max:255',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort' => 'nullable|string|max:50',
            ]);

            return response()->json(
                $this->service->index($filters)
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc đơn hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đơn hàng',
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
            ], $e->getCode() ?: 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết đơn hàng',
                'data' => null,
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'status' => 'required|string|in:processing,shipped,completed,cancelled',
                'cancel_reason' => 'nullable|string|max:255',
            ]);

            return response()->json(
                $this->service->updateStatus((int) $id, $data)
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Trạng thái đơn hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $e->getCode() ?: 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái đơn hàng',
                'data' => null,
            ], 500);
        }
    }
}