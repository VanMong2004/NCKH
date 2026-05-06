<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Exception;

class CartService
{
    // =========================
    // GET CART
    // =========================
    public function getCart($user)
    {
        $cart = Cart::with([
            'items.productVariant.product.images'
        ])->firstOrCreate([
            'user_id' => $user->id
        ]);

        return [
            'success' => true,
            'data' => $this->formatCart($cart)
        ];
    }

    // =========================
    // ADD TO CART
    // =========================
    public function addToCart($user, $data)
    {
        return DB::transaction(function () use ($user, $data) {

            $variant = ProductVariant::lockForUpdate()->findOrFail($data['product_variant_id']);

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new Exception('Sản phẩm đã hết hàng');
            }

            $cart = Cart::firstOrCreate([
                'user_id' => $user->id
            ]);

            $item = CartItem::where([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id
            ])->first();

            $newQty = $data['quantity'];

            if ($item) {
                $newQty = $item->quantity + $data['quantity'];
            }

            // 🔥 clamp
            if ($newQty > $available) {
                $newQty = $available;

                if ($item) {
                    $item->quantity = $newQty;
                    $item->save();
                } else {
                    CartItem::create([
                        'cart_id' => $cart->id,
                        'product_variant_id' => $variant->id,
                        'quantity' => $newQty,
                    ]);
                }

                return [
                    'success' => true,
                    'warning' => 'Số lượng vượt tồn kho, đã tự điều chỉnh',
                ];
            }

            if ($item) {
                $item->quantity = $newQty;
                $item->save();
            } else {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_variant_id' => $variant->id,
                    'quantity' => $newQty,
                ]);
            }

            return [
                'success' => true,
                'message' => 'Đã thêm vào giỏ hàng'
            ];
        });
    }

    // =========================
    // UPDATE ITEM
    // =========================
    public function updateItem($user, $data)
    {
        return DB::transaction(function () use ($user, $data) {

            $cart = Cart::where('user_id', $user->id)->firstOrFail();

            $item = CartItem::where([
                'cart_id' => $cart->id,
                'product_variant_id' => $data['product_variant_id']
            ])->firstOrFail();

            $variant = ProductVariant::lockForUpdate()->findOrFail($data['product_variant_id']);

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new Exception('Sản phẩm đã hết hàng');
            }

            $qty = min($data['quantity'], $available);

            $item->quantity = $qty;
            $item->save();

            if ($qty < $data['quantity']) {
                return [
                    'success' => true,
                    'warning' => 'Đã điều chỉnh theo tồn kho'
                ];
            }

            return [
                'success' => true,
                'message' => 'Cập nhật thành công'
            ];
        });
    }

    // =========================
    // REMOVE ITEM
    // =========================
    public function removeItem($user, $data)
    {
        $cart = Cart::where('user_id', $user->id)->firstOrFail();

        CartItem::where([
            'cart_id' => $cart->id,
            'product_variant_id' => $data['product_variant_id']
        ])->delete();

        return [
            'success' => true,
            'message' => 'Đã xoá sản phẩm'
        ];
    }

    // =========================
    // FORMAT CART (🔥 FE READY)
    // =========================
    private function formatCart($cart)
    {
        $items = $cart->items->map(function ($item) {

            $variant = $item->productVariant;
            $product = $variant->product;

            return [
                'product_variant_id' => $variant->id,
                'product_name' => $product->name,
                'thumbnail' => optional(
                    $product->images->where('type', 'thumbnail')->first()
                )->url,
                'price' => $variant->price,
                'quantity' => $item->quantity,
                'size' => $variant->size,
                'color' => $variant->color,
                'total' => $variant->price * $item->quantity
            ];
        });

        return [
            'items' => $items,
            'total' => $items->sum('total')
        ];
    }

    // =========================
    // COUNT CART 
    // =========================
    public function getCount($user)
    {
        $count = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('quantity');

        return [
            'success' => true,
            'data' => $count
        ];
    }
}