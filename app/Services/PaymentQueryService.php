<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use RuntimeException;

class PaymentQueryService
{
    /**
     * List payments by order
     */
    public function list($user, $orderId)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = Order::where('user_id', $user->id)
            ->find($orderId);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        return Payment::where('order_id', $order->id)
            ->latest()
            ->get();
    }

    /**
     * Payment detail
     */
    public function show($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $payment = Payment::with('order.user.addresses')
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->find($id);

        if (!$payment) {
            throw new RuntimeException('Payment không tồn tại', 404);
        }

        $order = $payment->order;

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

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
                'address' => $order->resolvedShippingAddress(),
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

            'can_retry' => $payment->status==='failed'&&in_array($payment->method,['mock','vnpay']),
        ];
    }

    /**
     * Lịch sử payments của người dùng, có thể dùng cho trang lịch sử đơn hàng hoặc trang cá nhân
     */
    public function history($user, array $filters = [])
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $query = Payment::query()
            ->with('order')
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['method'])) {
            $query->where('method', $filters['method']);
        }

        return $query
            ->latest()
            ->paginate(20)
            ->through(function ($payment) {
                return [
                    'id' => $payment->id,

                    'transaction_id' => $payment->transaction_id,

                    'order_id' => $payment->order->id,

                    'order_code' => $payment->order->order_code,

                    'amount' => $payment->amount,

                    'method' => $payment->method,

                    'status' => $payment->status,

                    'created_at' => $payment->created_at,

                    'paid_at' => $payment->status === 'success'
                        ? $payment->updated_at
                        : null,
                ];
            });
    }

    /**
     * Lấy tổng quan về payment của người dùng (tổng số tiền đã thanh toán, số lượng đơn hàng đã thanh toán, v.v.)
     */
    public function summary($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $query = Payment::query()
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });

        $totalTransactions = (clone $query)->count();

        $successTransactions = (clone $query)
            ->where('status', 'success')
            ->count();

        $failedTransactions = (clone $query)
            ->where('status', 'failed')
            ->count();

        $pendingTransactions=(clone $query)
            ->where('status','pending')
            ->count();

        $refundedTransactions = (clone $query)
            ->where('status', 'refunded')
            ->count();

        $totalPaidAmount = (clone $query)
            ->where('status', 'success')
            ->sum('amount');

        return [
            'total_transactions' => $totalTransactions,

            'success_transactions' => $successTransactions,

            'failed_transactions' => $failedTransactions,

            'pending_transactions' => $pendingTransactions,

            'refunded_transactions' => $refundedTransactions,

            'total_paid_amount' => (float) $totalPaidAmount,
        ];
    }
}
