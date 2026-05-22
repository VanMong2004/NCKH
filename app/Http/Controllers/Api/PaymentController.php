<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;

use App\Services\PaymentService;
use App\Services\PaymentQueryService;

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
        $request->validate([
            'method' => 'required|in:cod,bank_transfer,momo,vnpay,mock'
        ]);

        $order = Order::findOrFail($id);

        $result = $this->paymentService->pay($order, $request->method);

        return response()->json([
            'message' => 'Tạo payment thành công',
            'data' => $result
        ]);
    }

    /**
     * callback payment của đơn hàng
     */
    public function callback(Request $request)
    {
        $result = $this->paymentService->handleCallback($request->all());

        return response()->json($result);
    }

    /**
     * Danh sách payments của đơn hàng
     */
    public function list(Request $request, $id)
    {
        try {

            $payments = $this->paymentQueryService->list(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy payments thành công',
                'data' => $payments
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    /**
     * Chi tiết payment
     */
    public function show(Request $request, $id)
    {
        try {

            $payment = $this->paymentQueryService->show(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy payment thành công',
                'data' => $payment
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }
}