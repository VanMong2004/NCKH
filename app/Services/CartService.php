<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\ProductVariant;
use App\Models\CartItem;

class CartService
{
    public function getOrCreateCart($userId)
    {
        $cart = Cart::where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$cart) {
            $cart = Cart::create([
                'user_id' => $userId,
                'status' => 'active',
            ]);
        }

        return $cart;
    }

    public function addToCart($userId, $variantId, $quantity)
    {
        // 1. Check variant tồn tại
        $variant = ProductVariant::find($variantId);

        if (!$variant) {
            throw new \Exception('Variant không tồn tại');
        }

        // 2. Lấy cart
        $cart = $this->getOrCreateCart($userId);

        // 3. Check item đã tồn tại chưa
        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_variant_id', $variantId)
            ->first();

        if ($item) {
            // CASE 1: đã có → cộng dồn
            $newQuantity = $item->quantity + $quantity;
        } else {
            $newQuantity = $quantity;
        }

        // 4. Check stock (CASE 2)
        if ($newQuantity > $variant->stock) {
            throw new \Exception('Sản phẩm chỉ còn ' . $variant->stock . ' cái');
        }

        // 5. Lưu
        if ($item) {
            $item->update([
                'quantity' => $newQuantity
            ]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_variant_id' => $variantId,
                'quantity' => $quantity
            ]);
        }

        // 6. Return cart mới nhất
        return $cart->load('items.productVariant.product.images');
    }

    public function updateItem($userId, $itemId, $quantity)
    {
        $cart = $this->getOrCreateCart($userId);

        $item = CartItem::where('id', $itemId)
            ->where('cart_id', $cart->id)
            ->first();

        if (!$item) {
            throw new \Exception('Item không tồn tại trong giỏ');
        }

        // Nếu quantity = 0 → xoá
        if ($quantity <= 0) {
            $item->delete();

            return $cart->load('items.productVariant.product.images');
        }

        // Check stock
        $variant = ProductVariant::find($item->product_variant_id);

        if (!$variant) {
            throw new \Exception('Variant không tồn tại');
        }

        if ($quantity > $variant->stock) {
            throw new \Exception('Sản phẩm chỉ còn ' . $variant->stock . ' cái');
        }

        // Update
        $item->update([
            'quantity' => $quantity
        ]);

        return $cart->load('items.productVariant.product.images');
    }

    public function removeItem($userId, $itemId)
    {
        $cart = $this->getOrCreateCart($userId);

        $item = CartItem::where('id', $itemId)
            ->where('cart_id', $cart->id)
            ->first();

        if (!$item) {
            throw new \Exception('Item không tồn tại');
        }

        $item->delete();

        return $cart->load('items.productVariant.product.images');
    }

    public function calculateCart($cart)
    {
        $totalQuantity = 0;
        $totalPrice = 0;

        foreach ($cart->items as $item) {
            $quantity = $item->quantity;
            $price = (float) $item->productVariant->price;

            $totalQuantity += $quantity;
            $totalPrice += $quantity * $price;
        }

        return [
            'total_quantity' => $totalQuantity,
            'total_price' => $totalPrice
        ];
    }
}