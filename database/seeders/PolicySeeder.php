<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Policy;

class PolicySeeder extends Seeder
{
    public function run(): void
    {
        Policy::truncate();

        $policies = [

            [
                'title' => 'Chính sách thanh toán',
                'slug' => 'payment-policy',
                'type' => 'policy',
                'content' => '
                <h2>Chính sách thanh toán</h2>

                <p>
                Hệ thống hỗ trợ COD, chuyển khoản ngân hàng,
                Momo và VNPay.
                </p>
                ',
                'sort_order' => 1,
            ],

            [
                'title' => 'Chính sách nhận hàng',
                'slug' => 'pickup-policy',
                'type' => 'policy',
                'content' => '
                <h2>Chính sách nhận hàng</h2>

                <p>
                Sinh viên cần xuất trình MSSV
                hoặc QR Code khi nhận hàng.
                </p>
                ',
                'sort_order' => 2,
            ],

            [
                'title' => 'Chính sách hoàn tiền',
                'slug' => 'refund-policy',
                'type' => 'policy',
                'content' => '
                <h2>Chính sách hoàn tiền</h2>

                <p>
                Hoàn tiền chỉ áp dụng khi sản phẩm lỗi
                hoặc thanh toán lỗi.
                </p>
                ',
                'sort_order' => 3,
            ],

            [
                'title' => 'Điều khoản sử dụng',
                'slug' => 'terms-of-service',
                'type' => 'terms',
                'content' => '
                <h2>Điều khoản sử dụng</h2>

                <p>
                Người dùng chịu trách nhiệm
                về thông tin cung cấp.
                </p>
                ',
                'sort_order' => 4,
            ],

            [
                'title' => 'Điều khoản Campaign',
                'slug' => 'campaign-terms',
                'type' => 'terms',
                'content' => '
                <h2>Điều khoản Campaign</h2>

                <p>
                Campaign có thời gian mở và đóng
                theo quy định từng đợt.
                </p>
                ',
                'sort_order' => 5,
            ],
        ];

        foreach ($policies as $policy) {

            Policy::create([
                ...$policy,
                'is_active' => true
            ]);
        }
    }
}