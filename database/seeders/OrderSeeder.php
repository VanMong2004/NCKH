<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Models\Address;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $variant = ProductVariant::first();

        $statuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

        $address = Address::query()
                ->where('user_id', 2)
                ->first();

        foreach ($statuses as $status) {

            $order = Order::create([
                'user_id' => 2,
                'type' => 'normal',
                'order_code' => 'ORD-' . strtoupper(Str::random(6)),
                'status' => $status,
                'cancel_reason' => $status === 'cancelled' ? 'payment_timeout' : null,
                'total' => 200000,
                'shipping_fee' => 0,
                'shipping_name'
                    => $address?->full_name ?? 'Nguyen Van A',

                'shipping_phone'
                    => $address?->phone ?? '0123456789',

                'shipping_address'
                    => $address
                        ? implode(', ', [

                            $address->address_line,

                            $address->ward,

                            $address->district,

                            $address->province,
                        ])
                        : 'CTUT',
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'price' => $variant->price,
                'quantity' => 2,
                'product_name' => 'Áo CTU',
                'variant_snapshot' => 'M-Trắng',
            ]);
        }
    }
}