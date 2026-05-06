<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Events\OrderPaid;

class MockPaymentGatewayService
{
    public function create(Payment $payment)
    {
        // giả lập trả URL
        return [
            'payment_id' => $payment->id,
            'redirect_url' => url("/api/payment/callback?payment_id={$payment->id}&status=success&method=mock")
        ];
    }

    public function callback(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payment = Payment::lockForUpdate()->findOrFail($data['payment_id']);

            // 🔥 chống double callback
            if ($payment->status === 'success') {
                return ['message' => 'Payment đã xử lý'];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

            $status = $data['status'] === 'success' ? 'success' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data
            ]);

            if ($status === 'success') {

                $order->update([
                    'status' => 'paid'
                ]);

                // 🔥 FIRE EVENT
                $order->load('items.productVariant');
                event(new OrderPaid($order));
            }

            return [
                'message' => 'Callback xử lý thành công'
            ];
        });
    }
}