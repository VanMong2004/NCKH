<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\OrderService;
use App\Services\CartService;
use App\Models\Order;

class AdminOrderController extends Controller
{
    protected $orderService;
    protected $cartService;

    public function __construct(OrderService $orderService, CartService $cartService)
    {
        $this->orderService = $orderService;
        $this->cartService = $cartService;
    }

    public function updateStatus(Request $request, $id) // Dành cho admin
    {
        try {
            $request->validate([
                'status' => 'required|in:processing,shipped,completed'
            ]);

            $order = Order::with('items.productVariant')
                ->findOrFail($id);

            $result = app(OrderService::class)
                ->updateStatus($order, $request->status);

            return response()->json([
                'message' => 'Cập nhật trạng thái thành công',
                'data' => $result
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function adminOrders(Request $request)
    {
        $query = Order::query();

        // 🔥 FILTER STATUS
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // 🔥 FILTER USER
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // 🔥 FILTER DATE
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [
                $request->from_date,
                $request->to_date
            ]);
        }

        // 🔥 SEARCH
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('order_code', 'like', "%{$request->search}%")
                ->orWhere('shipping_phone', 'like', "%{$request->search}%");
            });
        }

        // 🔥 SORT
        $sort = $request->sort ?? 'desc';

        $orders = $query->orderBy('id', $sort)
            ->paginate(10);

        return response()->json($orders);
    }

    public function adminShow($id)
    {
        $order = Order::with('items.productVariant', 'user')
            ->findOrFail($id);

        return response()->json([
            'order' => $order,
            'user' => [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
            ],
            'items' => $order->items
        ]);
    }
}