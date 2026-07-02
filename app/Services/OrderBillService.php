<?php

namespace App\Services;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use RuntimeException;

class OrderBillService
{
    public function downloadForUser($user, int $orderId)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = $this->baseQuery()
            ->where('user_id', $user->id)
            ->find($orderId);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        return $this->download($order);
    }

    public function downloadForGuest($user, ?string $guestToken, string $orderCode)
    {
        $order = $this->baseQuery()
            ->where('order_code', $orderCode)
            ->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng', 404);
        }

        if ($user) {
            if ((int) $order->user_id !== (int) $user->id) {
                throw new RuntimeException('Bạn không có quyền xem đơn hàng này', 403);
            }
        } elseif (!$guestToken || $order->guest_token !== $guestToken) {
            throw new RuntimeException('Không đủ thông tin để tải bill đơn hàng khách', 401);
        }

        return $this->download($order);
    }

    private function baseQuery()
    {
        return Order::with([
            'items',
            'payments',
            'user.addresses',
        ]);
    }

    private function download(Order $order)
    {
        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        $pdf = Pdf::loadView('pdf.order-bill', [
            'order' => $order,
            'payment' => $payment,
            'items' => $order->items,
            'issuedAt' => now(),
        ]);

        return $pdf->download("bill-{$order->order_code}.pdf");
    }
}
