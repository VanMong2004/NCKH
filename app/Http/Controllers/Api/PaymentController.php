<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentQueryService;
use App\Services\PaymentService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected PaymentQueryService $paymentQueryService
    ) {}

    public function pay(Request $request, $id)
    {
        try {
            $request->merge(['order_id' => $id]);
            $user = auth('sanctum')->user();

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
                'method' => 'required|in:cod,mock_bank,cash_on_pickup',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
                'method.required' => 'Vui lòng chọn phương thức thanh toán',
                'method.in' => 'Phương thức thanh toán không hợp lệ',
            ]);

            $result = $this->paymentService->pay(
                $user,
                $request->header('X-Guest-Token'),
                $data['order_id'],
                $data['method']
            );

            return response()->json([
                'success' => true,
                'message' => 'Tạo thanh toán thành công',
                'data' => $result,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thanh toán không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409, 422], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Create payment database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Create payment system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function callback(Request $request)
    {
        try {
            $request->validate([
                'method' => 'nullable|in:mock_bank',
            ], [
                'method.in' => 'Callback không hợp lệ',
            ]);

            $result = $this->paymentService->handleCallback($request->all());
            $orderCode = $result['order_code'] ?? null;
            $orderId = $result['order_id'] ?? null;
            $status = $result['status'] ?? $request->status ?? 'unknown';

            if (!$orderCode && $orderId) {
                $orderCode = Order::find($orderId)?->order_code;
            }

            return redirect(
                '/order-success?' . http_build_query([
                    'order_id' => $orderId,
                    'order_code' => $orderCode,
                    'status' => $status,
                ])
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Callback không hợp lệ',
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 404, 409, 422], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Payment callback database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Payment callback system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function list(Request $request, $id)
    {
        try {
            $request->merge(['order_id' => $id]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ]);

            $payments = $this->paymentQueryService->list(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách thanh toán thành công',
                'data' => $payments,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Get payments database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Get payments system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $request->merge(['payment_id' => $id]);

            $data = $request->validate([
                'payment_id' => 'required|integer|min:1',
            ]);

            $payment = $this->paymentQueryService->show(
                $request->user(),
                $data['payment_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết thanh toán thành công',
                'data' => $payment,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thanh toán không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Get payment detail database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Get payment detail system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function history(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|in:unpaid,paid,failed,refunded',
                'method' => 'nullable|in:cod,mock_bank,cash_on_pickup',
            ]);

            $payments = $this->paymentQueryService->history(
                $request->user(),
                $filters
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy lịch sử giao dịch thành công',
                'data' => $payments,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu lọc không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Get payment history database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Get payment history system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function summary(Request $request)
    {
        try {
            $summary = $this->paymentQueryService->summary($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê giao dịch thành công',
                'data' => $summary,
            ]);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Get payment summary database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Get payment summary system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}
