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

    // =========================
    public function index(Request $request)
    {
        return response()->json(
            $this->cartService->getCart($request->user())
        );
    }

    // =========================
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1'
        ]);

        return response()->json(
            $this->cartService->addToCart(
                $request->user(),
                $data
            )
        );
    }

    // =========================
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        return response()->json(
            $this->cartService->updateItem(
                $request->user(),
                $id,
                $data['quantity']
            )
        );
    }

    // =========================
    public function destroy(Request $request, $id)
    {
        return response()->json(
            $this->cartService->removeItem(
                $request->user(),
                $id
            )
        );
    }

    // =========================
    public function count(Request $request)
    {
        return response()->json(
            $this->cartService->getCount($request->user())
        );
    }
}