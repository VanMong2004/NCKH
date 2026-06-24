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
                'answer' => 'Chọn sản phẩm, thêm vào giỏ hàng và tiến hành thanh toán.'
            ],

            [
                'category' => 'payment',
                'question' => 'Có hỗ trợ thanh toán Momo không?',
                'answer' => 'Có. Hệ thống hỗ trợ Momo, VNPay và chuyển khoản.'
            ],

            [
                'category' => 'shipping',
                'question' => 'Bao lâu nhận được hàng?',
                'answer' => 'Thông thường từ 2-5 ngày làm việc.'
            ],

            [
                'category' => 'return',
                'question' => 'Có được đổi size áo không?',
                'answer' => 'Có thể đổi trong vòng 7 ngày nếu còn nguyên tem.'
            ],

            [
                'category' => 'student',
                'question' => 'Sinh viên CTUT có ưu đãi không?',
                'answer' => 'Một số chương trình ưu đãi dành riêng cho sinh viên CTUT.'
            ],
        ];

        foreach ($faqs as $index => $faq) {

            Faq::create([
                ...$faq,
                'is_active' => true,
                'sort_order' => $index + 1,
            ]);
        }
    }
}