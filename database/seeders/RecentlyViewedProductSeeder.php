<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\RecentlyViewedProduct;
use App\Models\User;
use Illuminate\Database\Seeder;

class RecentlyViewedProductSeeder extends Seeder
{
    public function run(): void
    {
        $mapping = [
            'nhat.b2200001@ctuet.edu.vn' => [
                'Áo thun CTUT K2026',
                'Ly giữ nhiệt CTUT',
                'Hoodie CTUT Premium',
            ],

            'anh.b2200102@ctuet.edu.vn' => [
                'Áo khoa CNTT',
                'Nón lưỡi trai CTUT',
                'Túi tote CTUT',
            ],

            'bao.b2300221@ctuet.edu.vn' => [
                'Sticker CTUT',
                'Bảng tên sinh viên CTUT',
                'Dây đeo thẻ CTUT',
            ],
        ];

        foreach ($mapping as $email => $products) {

            $user = User::where('email', $email)->first();

            if (!$user) continue;

            foreach ($products as $index => $productName) {

                $product = Product::where(
                    'name',
                    $productName
                )->first();

                if (!$product) continue;

                RecentlyViewedProduct::updateOrCreate([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ], [
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'viewed_at' => now()->subDays($index + 1),
                ]);
            }
        }
    }
}
