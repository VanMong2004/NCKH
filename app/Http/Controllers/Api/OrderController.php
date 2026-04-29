<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\OrderService;
use App\Services\CartService;
use App\Models\Order;

class OrderController extends Controller
{
    protected $orderService;
    protected $cartService;

    public function __construct(OrderService $orderService, CartService $cartService)
    {
        $this->orderService = $orderService;
        $this->cartService = $cartService;
    }

    public function checkout(Request $request)
    {
        try {
            // ✅ validate input
            $request->validate([
                'shipping_name' => 'required|string',
                'shipping_phone' => 'required|string',
                'shipping_address' => 'required|string',
            ]);

            // 🛒 lấy cart
            $cart = $this->cartService
                ->getOrCreateCart($request->user()->id)
                ->load('items.productVariant');

            // 🚀 gọi service
            $order = $this->orderService->checkout(
                $request->user()->id,
                $cart,
                $request->all()
            );

            return response()->json([
                'message' => 'Đặt hàng thành công',
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function finalize($orderId)
    {
        try {
            $order = $this->orderService->finalizeOrder($orderId);

            return response()->json([
                'message' => 'Thanh toán thành công',
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function cancel($id)
    {
        try {
            $order = Order::with('items.productVariant')
                ->where('user_id', auth()->id())
                ->findOrFail($id);

            $result = app(OrderService::class)->cancelOrder($order);

            return response()->json([
                'message' => 'Huỷ đơn thành công',
                'data' => $result
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
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

    public function confirm($id)
    {
        try {
            $order = Order::with('items.productVariant')
                ->findOrFail($id);

            $result = app(OrderService::class)
                ->confirmOrder($order, auth()->id());

            return response()->json([
                'message' => 'Đã nhận hàng thành công',
                'data' => $result
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function myOrders(Request $request)
    {
        $query = Order::where('user_id', $request->user()->id);

        // 🔥 filter status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // 🔥 sort mới nhất
        $orders = $query->orderBy('id', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    public function show($id, Request $request)
    {
        /** @var \App\Models\Order $order */
        $order = Order::with('items.productVariant')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        /** @var \Illuminate\Database\Eloquent\Collection $orderItems */
        $orderItems = $order->items;

        // 🔥 ITEMS
        $items = $orderItems->map(function ($item) {
            return [
                'id' => $item->id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->product_name,
                'variant' => $item->variant_snapshot,
                'price' => (float)$item->price,
                'quantity' => $item->quantity,
                'subtotal' => $item->price * $item->quantity,
            ];
        });

        // 🔥 SUMMARY
        $totalQuantity = $orderItems->sum('quantity');

        $summary = [
            'total_quantity' => $totalQuantity,
            'total_price' => (float)$order->total,
            'shipping_fee' => (float)$order->shipping_fee,
            'final_total' => (float)$order->total + (float)$order->shipping_fee,
        ];

        // 🔥 STATUS LABEL
        $statusLabels = [
            'pending' => 'Chờ thanh toán',
            'paid' => 'Đã thanh toán',
            'processing' => 'Đang xử lý',
            'shipped' => 'Đang giao',
            'completed' => 'Hoàn thành',
            'cancelled' => 'Đã hủy',
        ];

        // 🔥 ACTIONS
        $actions = [
            'can_cancel' => $order->status === 'pending',
            'can_confirm' => $order->status === 'shipped',
        ];

        return response()->json([
            'order' => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $order->status,
                'status_label' => $statusLabels[$order->status] ?? $order->status,
                'shipping_name' => $order->shipping_name,
                'shipping_phone' => $order->shipping_phone,
                'shipping_address' => $order->shipping_address,
                'created_at' => $order->created_at,
            ],
            'items' => $items,
            'summary' => $summary,
            'actions' => $actions,
        ]);
    }
}