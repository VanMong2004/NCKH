<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Exception;
use RuntimeException;
use App\Services\PromotionPriceService;

class CartService
{
    public function __construct(
        protected PromotionPriceService $promotionPriceService
    ) {}

    // =========================
    // GET CART
    // =========================
    public function getCart($user, ?string $guestToken)
    {
        $cart = Cart::where(
            $this->getCartOwnerCondition(
                $user,
                $guestToken
            )
        )->first();

        $cart->load([
            'items',
            'items.productVariant',
            'items.productVariant.product',
            'items.productVariant.product.images',
        ]);

        return [
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm trong giỏ hàng thành công',
            'data' => $this->formatCart($cart, $user),
        ];
    }

    // =========================
    // ADD TO CART
    // =========================
    public function addToCart($user, ?string $guestToken, array $data)
    {
        // if (!$user) {
        //     throw new RuntimeException('Vui lòng đăng nhập', 401);
        // }

        return DB::transaction(function () use ($user, $guestToken, $data) {
            $variant = ProductVariant::lockForUpdate()
                ->find($data['product_variant_id']);

            if (($data['quantity'] ?? 0) <= 0) {
                throw new RuntimeException('Số lượng phải lớn hơn 0', 400);
            }

            if (!$variant) {
                throw new RuntimeException('Biến thể sản phẩm không tồn tại', 404);
            }

            $available = $variant->stock - $variant->reserved_stock;

            if ($available <= 0) {
                throw new RuntimeException('Sản phẩm đã hết hàng', 400);
            }

            $cart = Cart::firstOrCreate(
                $this->getCartOwnerCondition($user, $guestToken)
            );

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
                'message' => 'Đã thêm sản phẩm vào giỏ hàng',
            ];
        });
    }

    // =========================
    // UPDATE ITEM
    // =========================
    public function updateItem($user, ?string $guestToken, $cartItemId, $quantity)
    {
        // if (!$user) {
        //     throw new RuntimeException('Vui lòng đăng nhập', 401);
        // }

        return DB::transaction(function () use ($user, $guestToken, $cartItemId, $quantity) {
            $cart = Cart::where(
                $this->getCartOwnerCondition($user, $guestToken)
            )->first();

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

            if ($quantity <= 0) {
                throw new RuntimeException('Số lượng phải lớn hơn 0', 400);
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
    public function removeItem($user, ?string $guestToken, $cartItemId)
    {
        // if (!$user) {
        //     throw new RuntimeException('Vui lòng đăng nhập', 401);
        // }

        $cart = Cart::where(
            $this->getCartOwnerCondition($user, $guestToken)
        )->first();

        if (!$cart) {
            throw new RuntimeException('Giỏ hàng không tồn tại', 404);
        }

        $item = CartItem::lockForUpdate()
            ->where([
                'cart_id' => $cart->id,
                'id' => $cartItemId,
            ])
            ->first();

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
    // FORMAT CART
    // =========================
    private function formatCart($cart, $user = null)
    {
        $items = $cart->items->map(function ($item) use ($user) {
            $variant = $item->productVariant;
            $product = $variant?->product;

            if (!$variant || !$product) {
                return null;
            }

            $priceData = $this->promotionPriceService
                ->calculateForVariant(
                    $variant,
                    $user,
                    (int) $item->quantity
                );

            $originalPrice = (float) $priceData['original_price'];
            $discountAmount = (float) $priceData['discount_amount'];
            $finalPrice = (float) $priceData['final_price'];

            return [
                'cart_item_id' => $item->id,

                'product_id' => $product->id,

                'product_variant_id' => $variant->id,

                'slug' => $product->slug,

                'product_name' => $product->name,

                'thumbnail' => optional(
                    $product->images
                        ->where('type', 'thumbnail')
                        ->first()
                )->url ?? optional(
                    $product->images->first()
                )->url,

                // Giữ tương thích FE cũ
                'price' => $finalPrice,

                'quantity' => $item->quantity,

                'size' => $variant->size,

                'color' => $variant->color,

                'attributes' => $variant->attributes ?? [],

                // Giá chuẩn mới
                'original_price' => $originalPrice,

                'discount_amount' => $discountAmount,

                'final_price' => $finalPrice,

                'promotion_price' => $priceData['promotion_price'],

                'promotion' => $priceData['promotion'],

                'has_promotion' => $priceData['has_promotion'],

                'promotion_login_required' => $priceData['promotion_login_required'],

                'stock' => $variant->stock,

                'available_stock' => max(
                    0,
                    $variant->stock - $variant->reserved_stock
                ),

                'selected' => (bool) $item->is_selected,

                'total' => $finalPrice * $item->quantity,

                'original_total' => $originalPrice * $item->quantity,

                'discount_total' => $discountAmount * $item->quantity,
            ];
        })
        ->filter()
        ->values();

        $subTotal = $items->sum('original_total');

        $shipping = 0;

        $discount = $items->sum('discount_total');

        $grandTotal = $subTotal + $shipping - $discount;

        return [
            'items' => $items,

            'item_count' => $items->sum('quantity'),

            'sub_total' => $subTotal,

            'shipping' => $shipping,

            'discount' => $discount,

            'grand_total' => $grandTotal,

            'has_login_required_promotion' => $items->contains(function ($item) {
                return $item['promotion_login_required'] === true;
            }),
        ];
    }

    // =========================
    // COUNT CART 
    // =========================
    public function getCount($user, ?string $guestToken)
    {
        $count = CartItem::whereHas('cart', function ($q) use ($user, $guestToken) {
            $q->where('status', 'active');

            if ($user) {
                $q->where('user_id', $user->id);
                return;
            }

            if (!$guestToken) {
                throw new RuntimeException('Thiếu mã giỏ hàng khách', 400);
            }

            $q->where('guest_token', $guestToken);
        })->sum('quantity');

        return [
            'success' => true,
            'data' => $count,
        ];
    }

    // =========================
    // PRIVATE: GET CART OWNER CONDITION
    // =========================
    private function getCartOwnerCondition($user, ?string $guestToken): array
    {
        if ($user) {
            return [
                'user_id' => $user->id,
                'status' => 'active',
            ];
        }

        if (!$guestToken) {
            throw new RuntimeException('Thiếu mã giỏ hàng khách', 400);
        }

        return [
            'guest_token' => $guestToken,
            'status' => 'active',
        ];
    }
}