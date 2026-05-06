<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Services\PaymentService;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    public function pay(Request $request, $id)
    {
        $request->validate([
            'method' => 'required|in:vnpay,mock'
        ]);

        $order = Order::findOrFail($id);

        $result = $this->paymentService->pay($order, $request->method);

        return response()->json([
            'message' => 'Tạo payment thành công',
            'data' => $result
        ]);
    }

    public function callback(Request $request)
    {
        $result = $this->paymentService->handleCallback($request->all());

        return response()->json($result);
    }
}