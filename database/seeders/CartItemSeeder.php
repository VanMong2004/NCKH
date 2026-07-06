<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class CartItemSeeder extends Seeder
{
    public function run(): void
    {
        $cartRules = [
            'nhat.b2200001@ctuet.edu.vn' => [
                ['Áo khoa CNTT', 'M', 'Đen', 1],
                ['Túi tote CTUT', null, null, 1],
            ],
            'anh.b2200102@ctuet.edu.vn' => [
                ['Ly giữ nhiệt CTUT', null, null, 1],
                ['Sticker CTUT', null, null, 2],
            ],
            'bao.b2300221@ctuet.edu.vn' => [
                ['Hoodie CTUT Premium', 'L', 'Đen', 1],
            ],
        ];

        foreach ($cartRules as $email => $items) {
            $cart = Cart::whereHas('user', fn ($q) => $q->where('email', $email))->first();

            if (!$cart) {
                continue;
            }

            foreach ($items as [$productName, $size, $color, $quantity]) {
                $variant = ProductVariant::whereHas('product', fn ($q) => $q->where('name', $productName))
                    ->when($size, fn ($q) => $q->where('size', $size))
                    ->when($color, fn ($q) => $q->where('color', $color))
                    ->first();

                if (!$variant) {
                    continue;
                }

                $cart->items()->updateOrCreate([
                    'product_variant_id' => $variant->id,
                ], [
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'is_selected' => true,
                ]);
            }
        }
    }
}
