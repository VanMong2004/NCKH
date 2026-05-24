<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\OrderQueryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class OrderController extends Controller
{
    protected $orderService;
    protected $orderQueryService;

    public function __construct(OrderService $orderService, OrderQueryService $orderQueryService)
    {
        $this->orderService = $orderService;
        $this->orderQueryService = $orderQueryService;
    }

    // =========================
    // POST /api/orders/checkout
    // =========================
    public function checkout(Request $request)
    {
        try {
            $data = $request->validate([
                'address_id' => 'required|integer|exists:addresses,id',
                'payment_method' => 'nullable|in:cod,bank_transfer,momo,vnpay,mock',
            ], [
                'address_id.required' => 'Vui lòng chọn địa chỉ giao hàng',
                'address_id.integer' => 'Địa chỉ giao hàng không hợp lệ',
                'address_id.exists' => 'Địa chỉ giao hàng không tồn tại',

                'payment_method.in' => 'Phương thức thanh toán không hợp lệ',
            ]);

            $result = $this->orderService->checkout(
                $request->user(),
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đặt hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Checkout database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Checkout system error', [
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
    // GET /api/orders/my-orders
    // =========================
    public function myOrders(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|max:50',
                'type' => 'nullable|string|max:50',
                'keyword' => 'nullable|string|max:255',
                'sort' => 'nullable|in:latest,oldest',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ], [
                'status.string' => 'Trạng thái đơn hàng không hợp lệ',
                'status.max' => 'Trạng thái đơn hàng không hợp lệ',

                'type.string' => 'Loại đơn hàng không hợp lệ',
                'type.max' => 'Loại đơn hàng không hợp lệ',

                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',

                'sort.in' => 'Kiểu sắp xếp không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số đơn hàng mỗi trang không hợp lệ',
                'per_page.min' => 'Số đơn hàng mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $orders = $this->orderQueryService->myOrders(
                $request->user(),
                $filters
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách order thành công',
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Get my orders database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Get my orders system error', [
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
    // GET /api/orders/{id}
    // =========================
    public function show(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
            ]);

            $order = $this->orderQueryService->show(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết order thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Get order detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Get order detail system error', [
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
    // POST /api/orders/{id}/cancel
    // =========================
    public function cancel(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
            ]);

            $order = $this->orderQueryService->cancel(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Hủy order thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Cancel order database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Cancel order system error', [
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
    // POST /api/orders/{id}/confirm
    // =========================
    public function confirm(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
            ]);

            $order = $this->orderQueryService->confirm(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Xác nhận nhận hàng thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Confirm order database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Confirm order system error', [
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