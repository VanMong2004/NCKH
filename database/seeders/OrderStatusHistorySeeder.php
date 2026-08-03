<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Database\Seeder;

class OrderStatusHistorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (Order::all() as $order) {
            $this->history($order, null, 'pending', 'Khởi tạo đơn hàng');

            match ($order->status) {
                'pending' => null,
                'cancelled' => $this->history($order, 'pending', 'cancelled', 'Đơn hàng bị hủy do hết hạn thanh toán'),
                'processing' => $this->processingFlow($order),
                'awaiting_receipt' => $this->awaitingReceiptFlow($order),
                'completed' => $this->fullCompletedFlow($order),
                default => null,
            };
        }
    }

    private function processingFlow(Order $order): void
    {
        $note = $order->payment_status === 'paid'
            ? 'Đơn hàng đã được thanh toán và đang được chuẩn bị'
            : 'Đơn hàng đang được chuẩn bị';

        $this->history($order, 'pending', 'processing', $note);
    }

    private function awaitingReceiptFlow(Order $order): void
    {
        $this->processingFlow($order);

        $this->history(
            $order,
            'processing',
            'awaiting_receipt',
            $order->fulfillment_method === 'pickup'
                ? 'Đơn hàng đã sẵn sàng nhận tại phòng'
                : 'Đơn hàng đang được giao đến khách hàng'
        );
    }

    private function fullCompletedFlow(Order $order): void
    {
        $this->awaitingReceiptFlow($order);
        $this->history($order, 'awaiting_receipt', 'completed', 'Khách hàng đã nhận hàng');
    }

    private function history(Order $order, ?string $oldStatus, string $newStatus, string $note): void
    {
        OrderStatusHistory::updateOrCreate([
            'order_id' => $order->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ], [
            'order_id' => $order->id,
            'changed_by' => 1,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'note' => $note,
        ]);
    }
}
