<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Exception;
use RuntimeException;

class CartService
{
    // =========================
    // GET CART
    // =========================
    public function getCart($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

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
            'data' => $this->formatCart($cart),
        ];
    }

    // =========================
    // ADD TO CART
    // =========================
    public function addToCart($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $data) {
            $variant = ProductVariant::lockForUpdate()
                ->find($data['product_variant_id']);

            if (!$variant) {
                throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
            }

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new RuntimeException('Sản phẩm đã hết hàng', 400);
            }

            $cart = Cart::firstOrCreate([
                'user_id' => $user->id,
                'status' => 'active',
            ]);

            $item = CartItem::where([
                'cart_id' => $cart->id,
                'product_variant_id' => $variant->id,
            ])->first();

            $newQty = $data['quantity'];

            if ($item) {
                $newQty = $item->quantity + $data['quantity'];
            }

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
                'message' => 'Đã thêm vào giỏ hàng',
            ];
        });
    }

    // =========================
    // UPDATE ITEM
    // =========================
    public function updateItem($user, $cartItemId, $quantity)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $cartItemId, $quantity) {
            $cart = Cart::where([
                'user_id' => $user->id,
                'status' => 'active',
            ])->first();

            if (!$cart) {
                throw new RuntimeException('Giỏ hàng không tồn tại', 404);
            }

            $item = CartItem::where([
                'cart_id' => $cart->id,
                'id' => $cartItemId,
            ])->first();

            if (!$item) {
                throw new RuntimeException('Sản phẩm không có trong giỏ hàng', 404);
            }

            $variant = ProductVariant::lockForUpdate()
                ->find($item->product_variant_id);

            if (!$variant) {
                throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
            }

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new RuntimeException('Sản phẩm đã hết hàng', 400);
            }

            $qty = min($quantity, $available);

            $item->quantity = $qty;
            $item->save();

            if ($qty < $quantity) {
                return [
                    'success' => true,
                    'warning' => 'Đã điều chỉnh theo tồn kho',
                ];
            }

            return [
                'success' => true,
                'message' => 'Cập nhật thành công',
            ];
        });
    }

    // =========================
    // REMOVE ITEM
    // =========================
    public function removeItem($user, $cartItemId)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $cart = Cart::where([
            'user_id' => $user->id,
            'status' => 'active',
        ])->first();

        if (!$cart) {
            throw new RuntimeException('Giỏ hàng không tồn tại', 404);
        }

        $item = CartItem::where([
            'cart_id' => $cart->id,
            'id' => $cartItemId,
        ])->first();

        if (!$item) {
            throw new RuntimeException('Sản phẩm không có trong giỏ hàng', 404);
        }

        $item->delete();

        return [
            'success' => true,
            'message' => 'Đã xoá sản phẩm',
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
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $count = CartItem::whereHas('cart', function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->where('status', 'active');
        })->sum('quantity');

        return [
            'success' => true,
            'data' => $count,
        ];
    }
}