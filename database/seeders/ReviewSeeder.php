<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $comments = [
            5 => [
                'Sản phẩm rất đẹp, đúng mô tả.',
                'Chất lượng vượt mong đợi, rất đáng tiền.',
                'Đóng gói cẩn thận, nhận hàng nhanh.',
                'Màu sắc đẹp, chất liệu tốt.',
                'Rất hài lòng, sẽ tiếp tục ủng hộ CTUT Store.',
            ],
            4 => [
                'Sản phẩm tốt, giao đúng hẹn.',
                'Chất lượng ổn trong tầm giá.',
                'Logo in đẹp, mặc thoải mái.',
                'Sản phẩm dùng tốt, đóng gói gọn gàng.',
            ],
        ];

        $orders = Order::with('items.productVariant.product')
            ->where('status', 'completed')
            ->whereNotNull('user_id')
            ->get();

        $index = 0;

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                if (!$item->productVariant) {
                    continue;
                }

                $rating = $index % 4 === 0 ? 4 : 5;

                Review::updateOrCreate([
                    'order_item_id' => $item->id,
                ], [
                    'user_id' => $order->user_id,
                    'product_id' => $item->productVariant->product_id,
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'rating' => $rating,
                    'comment' => $comments[$rating][$index % count($comments[$rating])],
                    'is_active' => true,
                ]);

                $index++;
            }
        }
    }
}
