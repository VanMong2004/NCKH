<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Review;
use App\Models\Order;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::with([
            'items.productVariant'
        ])
        ->where('status', 'completed')
        ->get();

        foreach ($orders as $order) {

            foreach ($order->items as $item) {

                Review::create([
                    'user_id' => $order->user_id,
                    'product_id' => $item->productVariant->product_id,
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'rating' => rand(4, 5),
                    'comment' => 'Sản phẩm rất tốt!',
                ]);
            }
        }
    }
}