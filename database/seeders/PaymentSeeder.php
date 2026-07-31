<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Order::all() as $order) {
            $method = match (true) {
                $order->fulfillment_method === 'pickup' && $order->payment_status === 'paid' && $order->status === 'completed' => 'cash_on_pickup',
                $order->fulfillment_method === 'pickup' && $order->payment_status !== 'paid' => 'mock_bank',
                $order->fulfillment_method === 'delivery' && $order->payment_status === 'unpaid' => 'cod',
                $order->fulfillment_method === 'delivery' && $order->payment_status === 'failed' => 'mock_bank',
                default => 'mock_bank',
            };

            Payment::updateOrCreate([
                'order_id' => $order->id,
            ], [
                'order_id' => $order->id,
                'method' => $method,
                'status' => $order->payment_status ?: 'unpaid',
                'amount' => $order->total,
                'transaction_id' => in_array($method, ['cod', 'cash_on_pickup'], true)
                    ? null
                    : 'TXN2026' . str_pad($order->id, 8, '0', STR_PAD_LEFT),
                'meta' => [
                    'source' => 'seed',
                    'order_code' => $order->order_code,
                    'fulfillment_method' => $order->fulfillment_method,
                ],
                'response_data' => [
                    'gateway' => $method,
                    'sandbox' => true,
                    'result' => $order->payment_status,
                ],
            ]);
        }
    }
}
