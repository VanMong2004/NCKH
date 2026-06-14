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

        if (!$variant) {
            return;
        }

        $statuses = [
            'pending',
            'paid',
            'processing',
            'shipped',
            'completed',
            'cancelled',
        ];

        $address = Address::where(
            'user_id',
            2
        )->first();

        foreach ($statuses as $status) {

            $quantity = 2;

            $subTotal = $variant->price * $quantity;

            $order = Order::create([
                'user_id' => 2,

                'type' => 'normal',

                'order_code' =>
                    'ORD-' . strtoupper(Str::random(8)),

                'status' => $status,

                'cancel_reason' =>
                    $status === 'cancelled'
                        ? 'payment_timeout'
                        : null,

                'shipping_name' =>
                    $address?->full_name ?? 'Nguyen Van A',

                'shipping_phone' =>
                    $address?->phone ?? '0123456789',

                'shipping_address' =>
                    $address
                        ? implode(', ', [
                            $address->address_line,
                            $address->ward,
                            $address->district,
                            $address->province,
                        ])
                        : 'CTUT',

                'sub_total' => $subTotal,
                'discount_total' => 0,
                'grand_total' => $subTotal,

                'shipping_fee' => 0,

                'total' => $subTotal,
            ]);

            OrderItem::create([
                'order_id' => $order->id,

                'product_variant_id' => $variant->id,

                'price' => $variant->price,

                'quantity' => $quantity,

                'product_name' =>
                    $variant->product->name,

                'variant_snapshot' => json_encode([
                    'size' => $variant->size,
                    'color' => $variant->color,
                    'sku' => $variant->sku,
                ]),

                'original_price' =>
                    $variant->price,

                'discount_amount' => 0,

                'final_price' =>
                    $variant->price,

                'promotion_id' => null,

                'promotion_snapshot' => null,
            ]);
        }
    }
}