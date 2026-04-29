<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PaymentService;
use App\Services\OrderService;
use App\Models\Order;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function pay($orderId)
    {
        try {
            $result = $this->paymentService->pay($orderId);

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function callback(Request $request)
    {
        try {
            $orderCode = $request->order_code;
            $status = $request->status; // success | failed

            $order = Order::where('order_code', $orderCode)->firstOrFail();

            if ($order->status !== 'pending') {
                throw new \Exception('Order đã được xử lý');
            }

            if ($status === 'success') {

                app(OrderService::class)->finalizeOrder($order->id);

            } else {

                app(OrderService::class)->cancelOrder($order->id);
            }

            return response()->json([
                'message' => 'Callback processed'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }
}