<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;

class PaymentQueryService
{
    /**
     * List payments by order
     */
    public function list($user, $orderId)
    {
        $order = Order::where('user_id', $user->id)
            ->findOrFail($orderId);

        return Payment::where('order_id', $order->id)
            ->latest()
            ->get();
    }

    /**
     * Payment detail
     */
    public function show($user, $id)
    {
        $payment = Payment::with('order')
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->findOrFail($id);

        $order = $payment->order;

        return [
            'id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'method' => $payment->method,
            'status' => $payment->status,
            'amount' => $payment->amount,

            'order' => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $order->status,
                'type' => $order->type,
                'total' => $order->total,
            ],

            'receiver' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->shipping_address,
            ],

            'timeline' => [
                [
                    'label' => 'Tạo giao dịch',
                    'status' => true,
                    'time' => optional($payment->created_at)->format('d/m/Y H:i'),
                ],
                [
                    'label' => 'Thanh toán thành công',
                    'status' => $payment->status === 'success',
                    'time' => $payment->status === 'success'
                        ? optional($payment->updated_at)->format('d/m/Y H:i')
                        : null,
                ],
            ],

            'receipt' => [
                'can_download' => $payment->status === 'success',
                'receipt_code' => 'PAY-' . str_pad($payment->id, 6, '0', STR_PAD_LEFT),
            ],

            'can_retry' => in_array($payment->status, ['pending', 'failed']),
        ];
    }
}