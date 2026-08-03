<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            'ORD-2026-00001' => 'mock_bank',
            'ORD-2026-00002' => 'cash_on_pickup',
            'ORD-2026-00003' => 'cod',
            'ORD-2026-00004' => 'mock_bank',
            'ORD-2026-00005' => 'cod',
            'ORD-2026-00006' => 'cod',
            'ORD-2026-00007' => 'mock_bank',
            'ORD-2026-00008' => 'mock_bank',
            'ORD-2026-00009' => 'cash_on_pickup',
            'ORD-2026-00010' => 'cod',
            'ORD-2026-00011' => 'mock_bank',
            'ORD-2026-00012' => 'cash_on_pickup',
        ];

        foreach (Order::all() as $order) {
            $method = $methods[$order->order_code] ?? 'mock_bank';

            Payment::updateOrCreate([
                'order_id' => $order->id,
                'method' => $method,
            ], [
                'order_id' => $order->id,
                'method' => $method,
                'status' => $order->payment_status ?: 'unpaid',
                'amount' => $order->total,
                'transaction_id' => in_array($method, ['cod', 'cash_on_pickup'], true)
                    ? null
                    : 'TXN2026' . str_pad((string) $order->id, 8, '0', STR_PAD_LEFT),
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
