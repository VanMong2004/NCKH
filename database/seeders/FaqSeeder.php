<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'category' => 'order',
                'question' => 'Làm sao để đặt hàng?',
                'answer' => 'Chọn sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán.',
            ],
            [
                'category' => 'payment',
                'question' => 'Hệ thống hỗ trợ những phương thức thanh toán nào?',
                'answer' => 'Hệ thống hiện hỗ trợ thanh toán khi nhận hàng, chuyển khoản ngân hàng và thanh toán trực tiếp khi nhận tại phòng.',
            ],
            [
                'category' => 'shipping',
                'question' => 'Bao lâu nhận được hàng?',
                'answer' => 'Thông thường từ 2 đến 5 ngày làm việc nếu chọn giao hàng tận nơi.',
            ],
            [
                'category' => 'return',
                'question' => 'Có được đổi size áo không?',
                'answer' => 'Có thể đổi trong vòng 7 ngày nếu sản phẩm còn nguyên tem và đủ điều kiện đổi trả.',
            ],
            [
                'category' => 'student',
                'question' => 'Sinh viên CTUT có ưu đãi không?',
                'answer' => 'Một số chương trình ưu đãi được áp dụng riêng cho sinh viên CTUT theo từng thời điểm.',
            ],
        ];

        foreach ($faqs as $index => $faq) {
            Faq::updateOrCreate([
                'question' => $faq['question'],
            ], [
                ...$faq,
                'is_active' => true,
                'sort_order' => $index + 1,
            ]);
        }
    }
}
