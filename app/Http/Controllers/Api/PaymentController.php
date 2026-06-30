<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;

use App\Services\PaymentService;
use App\Services\PaymentQueryService;

use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class PaymentController extends Controller
{
    protected $paymentService;
    protected $paymentQueryService;

    public function __construct(PaymentService $paymentService, PaymentQueryService $paymentQueryService)
    {
        $this->paymentService = $paymentService;
        $this->paymentQueryService = $paymentQueryService;
    }

    /**
     * Thanh toán đơn hàng
     */
    public function pay(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $user = auth('sanctum')->user();

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
                'method' => 'required|in:cod,vnpay,mock',
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
                'message' => 'Tạo payment thành công',
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
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Create payment database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Create payment system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * callback payment của đơn hàng
     */
    public function callback(Request $request)
    {
        try {
            $request->validate([
                'method' => 'nullable|in:mock,vnpay,cod',
            ], [
                'method.in' => 'Callback không hợp lệ',
            ]);

            // $result = $this->paymentService->handleCallback(
            //     $request->all()
            // );

            // return response()->json($result);

            $result = $this->paymentService->handleCallback(
                $request->all()
            );

            $orderCode = $result['order_code'] ?? null;
            $orderId   = $result['order_id'] ?? null;
            $status    = $result['status'] ?? $request->status ?? 'unknown';
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
            
            if (!$orderCode && $orderId) {
                $orderCode = Order::find($orderId)?->order_code;
            }
                
            $order = Order::find($orderId);
                
            return redirect()->away(
                $frontendUrl . '/order-success?' . http_build_query([
                    'order_code' => $orderCode,
                    'status'     => $status,
                ])
            );

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Callback không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Payment callback database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Payment callback system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Danh sách payments của đơn hàng
     */
    public function list(Request $request, $id)
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

            $payments = $this->paymentQueryService->list(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy payments thành công',
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
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get payments database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get payments system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Chi tiết payment
     */
    public function show(Request $request, $id)
    {
        try {
            $request->merge([
                'payment_id' => $id,
            ]);

            $data = $request->validate([
                'payment_id' => 'required|integer|min:1',
            ], [
                'payment_id.required' => 'Payment không hợp lệ',
                'payment_id.integer' => 'Payment không hợp lệ',
                'payment_id.min' => 'Payment không hợp lệ',
            ]);

            $payment = $this->paymentQueryService->show(
                $request->user(),
                $data['payment_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy payment thành công',
                'data' => $payment,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu payment không hợp lệ',
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
            Log::error('Get payment detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get payment detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Lịch sử payments của người dùng, có thể dùng cho trang lịch sử đơn hàng hoặc trang cá nhân
     */
    public function history(Request $request)
    {
        try {

            $filters = $request->validate([
                'status'=>'nullable|in:pending,success,failed,refunded',
                'method' => 'nullable|in:vnpay,momo,banking,baokim,mock,cod',
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
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Get payment history database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get payment history system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /**
     * Tổng quan về payment của người dùng, có thể dùng cho trang cá nhân hoặc dashboard (nếu có)
     */
    public function summary(Request $request)
    {
        try {

            $summary = $this->paymentQueryService->summary(
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê giao dịch thành công',
                'data' => $summary,
            ]);

        } catch (RuntimeException $e) {

            $statusCode = in_array(
                $e->getCode(),
                [400, 401, 404]
            )
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {

            Log::error('Get payment summary database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {

            Log::error('Get payment summary system error', [
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
