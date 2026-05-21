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
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'active',
        ]);

        $cart->load([
            'items',
            'items.productVariant',
            'items.productVariant.product',
            'items.productVariant.product.images',
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
                'user_id' => $user->id,
                'status' => 'active',
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
    public function updateItem($user, $cartItemId, $quantity)
    {
        return DB::transaction(function () use ($user, $cartItemId, $quantity) {

             $cart = Cart::where([
            'user_id' => $user->id,
            'status' => 'active',
        ])->firstOrFail();


            $item = CartItem::where([
                'cart_id'=>$cart->id,
                'id'=>$cartItemId
            ])->firstOrFail();

            $variant = ProductVariant::lockForUpdate()
            ->findOrFail(
                $item->product_variant_id
            );

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new Exception('Sản phẩm đã hết hàng');
            }

            $qty = min($quantity, $available);

            $item->quantity = $qty;
            $item->save();

            if($qty < $quantity) {
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
    public function removeItem($user, $cartItemId)
{
    $cart = Cart::where([
        'user_id' => $user->id,
        'status' => 'active',   // phải có điều kiện status là active để tránh 
    ])->firstOrFail();

    CartItem::where([
        'cart_id' => $cart->id,
        'id' => $cartItemId
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
                'cart_item_id' => $item->id,

                'product_id' => $product->id,

                'product_variant_id' => $variant->id,

                'slug' => $product->slug,

                'product_name' => $product->name,

                'thumbnail' => optional(
                    $product->images
                    ->where('type','thumbnail')
                    ->first()
                )->url,

                'price' => $variant->price,

                'quantity' => $item->quantity,

                'size' => $variant->size,

                'color' => $variant->color,

                'stock' => $variant->stock,

                'available_stock'
                => max(
                    0,
                    $variant->stock
                    -
                    $variant->reserved_stock
                ),

                'selected' => (bool) $item->is_selected,

                'total'
                => $variant->price
                *
                $item->quantity
            ];
        });

        $subTotal = $items->sum('total');

        $shipping = 0;

        $discount = 0;

        $grandTotal = $subTotal + $shipping - $discount;

        return [
            'items' => $items,

            'item_count' => $items->sum('quantity'),

            'sub_total' => $subTotal,

            'shipping' => $shipping,

            'discount' => $discount,

            'grand_total' => $grandTotal,
        ];
    }

    // =========================
    // COUNT CART 
    // =========================
    public function getCount($user)
    {
        $count = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id)
               ->where('status', 'active');
        })->sum('quantity');

        return [
            'success' => true,
            'data' => $count
        ];
    }
}