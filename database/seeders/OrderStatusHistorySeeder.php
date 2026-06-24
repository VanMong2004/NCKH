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

                'cancelled' => $this->history(
                    $order,
                    'pending',
                    'cancelled',
                    'Đơn hàng bị hủy do quá hạn thanh toán'
                ),

                'paid' => $this->history(
                    $order,
                    'pending',
                    'paid',
                    'Thanh toán thành công'
                ),

                'processing' => $this->paidAndProcessing($order),

                'shipped' => $this->paidProcessingAndShipped($order),

                'completed' => $this->fullCompletedFlow($order),

                default => null,
            };
        }
    }

    private function paidAndProcessing(Order $order): void
    {
        $this->history($order, 'pending', 'paid', 'Thanh toán thành công');
        $this->history($order, 'paid', 'processing', 'Đơn hàng đang được chuẩn bị');
    }

    private function paidProcessingAndShipped(Order $order): void
    {
        $this->paidAndProcessing($order);
        $this->history($order, 'processing', 'shipped', 'Đã bàn giao cho đơn vị vận chuyển');
    }

    private function fullCompletedFlow(Order $order): void
    {
        $this->paidProcessingAndShipped($order);
        $this->history($order, 'shipped', 'completed', 'Khách hàng đã nhận hàng');
    }

    private function history(
        Order $order,
        ?string $oldStatus,
        string $newStatus,
        string $note
    ): void {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'changed_by' => 1,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'note' => $note,
        ]);
    }
}