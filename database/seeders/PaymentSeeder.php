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
            'vnpay',
            'momo',
            'banking',
            'mock',
        ];

        foreach (Order::all() as $order) {
            $method = $methods[$order->id % count($methods)];

            Payment::create([
                'order_id' => $order->id,
                'method' => $method,
                'status' => match ($order->status) {
                    'pending' => 'pending',
                    'cancelled' => 'failed',
                    default => 'success',
                },
                'amount' => $order->total,
                'transaction_id' => $order->status === 'pending'
                    ? null
                    : 'TXN2026' . str_pad($order->id, 8, '0', STR_PAD_LEFT),
                'meta' => [
                    'source' => 'seed',
                    'order_code' => $order->order_code,
                ],
                'response_data' => [
                    'gateway' => $method,
                    'sandbox' => true,
                    'result' => match ($order->status) {
                        'pending' => 'waiting',
                        'cancelled' => 'failed',
                        default => 'success',
                    },
                ],
            ]);
        }
    }
}