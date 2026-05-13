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
        return Payment::with('order')
            ->whereHas('order', function ($q) use ($user) {

                $q->where('user_id', $user->id);

            })
            ->findOrFail($id);
    }
}