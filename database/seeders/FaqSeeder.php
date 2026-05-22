<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Faq;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        Faq::truncate();

        $faqs = [
            [
                'category' => 'order',
                'question' => 'Làm sao để đặt hàng?',
                'answer' => 'Bạn chọn sản phẩm, thêm vào giỏ hàng, kiểm tra thông tin nhận hàng và tiến hành thanh toán.',
                'sort_order' => 1,
            ],
            [
                'category' => 'payment',
                'question' => 'Có những phương thức thanh toán nào?',
                'answer' => 'Hệ thống hỗ trợ COD, chuyển khoản ngân hàng, Momo, VNPay và Mock Payment trong môi trường thử nghiệm.',
                'sort_order' => 2,
            ],
            [
                'category' => 'campaign',
                'question' => 'Campaign là gì?',
                'answer' => 'Campaign là đợt đăng ký sản phẩm theo thời gian, ví dụ đồng phục, áo khoa hoặc sản phẩm sự kiện.',
                'sort_order' => 3,
            ],
            [
                'category' => 'campaign',
                'question' => 'Làm sao để đăng ký campaign?',
                'answer' => 'Bạn vào trang Campaign, chọn campaign đang mở, chọn sản phẩm hoặc biến thể phù hợp rồi gửi đăng ký.',
                'sort_order' => 4,
            ],
            [
                'category' => 'pickup',
                'question' => 'Khi nhận hàng cần mang theo gì?',
                'answer' => 'Bạn cần mang theo MSSV, mã đơn hàng hoặc mã QR để đối chiếu khi nhận hàng.',
                'sort_order' => 5,
            ],
            [
                'category' => 'account',
                'question' => 'Tôi có thể cập nhật thông tin cá nhân không?',
                'answer' => 'Bạn có thể cập nhật họ tên, số điện thoại, MSSV và ảnh đại diện trong trang Hồ sơ cá nhân.',
                'sort_order' => 6,
            ],
            [
                'category' => 'review',
                'question' => 'Khi nào tôi được đánh giá sản phẩm?',
                'answer' => 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và thanh toán thành công.',
                'sort_order' => 7,
            ],
            [
                'category' => 'notification',
                'question' => 'Thông báo đơn hàng hiển thị ở đâu?',
                'answer' => 'Thông báo được hiển thị trong Notification Center và biểu tượng chuông trên thanh điều hướng.',
                'sort_order' => 8,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::create([
                ...$faq,
                'is_active' => true,
            ]);
        }
    }
}