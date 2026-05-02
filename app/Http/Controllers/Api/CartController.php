<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\CartService;

class CartController extends Controller
{
    protected $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    public function index(Request $request)
    {
        $cart = $this->cartService
            ->getOrCreateCart($request->user()->id)
            ->load('items.productVariant.product.images'); // Cho thêm product.images

        $totals = $this->cartService->calculateCart($cart);

        return response()->json([
            ...$cart->toArray(),
            ...$totals
        ]);
    }

    public function add(Request $request)
    {
        try {
            $request->validate([
                'product_variant_id' => 'required|integer',
                'quantity' => 'required|integer|min:1'
            ]);

            $cart = $this->cartService->addToCart(
                $request->user()->id,
                $request->product_variant_id,
                $request->quantity
            );

            return response()->json($cart);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function update(Request $request)
    {
        try {
            $request->validate([
                'item_id' => 'required|integer',
                'quantity' => 'required|integer|min:0'
            ]);

            $cart = $this->cartService->updateItem(
                $request->user()->id,
                $request->item_id,
                $request->quantity
            );

            return response()->json($cart);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function remove(Request $request)
    {
        try {
            $request->validate([
                'item_id' => 'required|integer'
            ]);

            $cart = $this->cartService->removeItem(
                $request->user()->id,
                $request->item_id
            );

            return response()->json($cart);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }
}