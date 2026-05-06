<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use App\Events\OrderPaid;

class VNPayService
{
    public function create(Payment $payment)
    {
        $vnpUrl = config('services.vnpay.url');
        $returnUrl = route('payment.callback');

        $params = [
            'vnp_TxnRef' => $payment->id,
            'vnp_Amount' => $payment->amount * 100,
            'vnp_OrderInfo' => 'Thanh toán đơn hàng',
            'vnp_ReturnUrl' => $returnUrl,
        ];

        $query = http_build_query($params);

        return [
            'payment_id' => $payment->id,
            'redirect_url' => $vnpUrl . '?' . $query
        ];
    }

    public function callback(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payment = Payment::lockForUpdate()->findOrFail($data['vnp_TxnRef']);

            if ($payment->status === 'success') {
                return ['message' => 'Payment đã xử lý'];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

            $status = ($data['vnp_ResponseCode'] === '00') ? 'success' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data
            ]);

            if ($status === 'success') {

                $order->update([
                    'status' => 'paid'
                ]);

                $order->load('items.productVariant');
                event(new OrderPaid($order));
            }

            return ['message' => 'VNPay callback handled'];
        });
    }
}