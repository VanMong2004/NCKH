<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\Order;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Order::all() as $order) {

            Payment::create([
                'order_id' => $order->id,
                'method' => 'mock',
                'status' => $order->status === 'paid' ? 'success' : 'pending',
                'amount' => $order->total,
            ]);
        }
    }
}