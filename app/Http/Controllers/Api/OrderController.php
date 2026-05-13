<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Services\OrderService;
use App\Services\OrderQueryService;

class OrderController extends Controller
{
    protected $orderService;
    protected $orderQueryService;

    public function __construct(OrderService $orderService, OrderQueryService $orderQueryService)
    {
        $this->orderService = $orderService;
        $this->orderQueryService = $orderQueryService;
    }

    // =========================
    // POST /api/orders/checkout
    // =========================
    public function checkout(Request $request)
    {
        try {

            // $request->validate([
            //     'shipping_name' => 'required|string|max:255',
            //     'shipping_phone' => 'required|string|max:20',
            //     'shipping_address' => 'required|string',
            // ]);
            $request->validate([
                'address_id' => 'required|exists:addresses,id',
            ]);

            $result = $this->orderService->checkout(
                $request->user(),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công',
                'data' => $result
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    // =========================
    // GET /api/orders/my-orders
    // =========================
    public function myOrders(Request $request)
    {
        try {

            $orders = $this->orderQueryService->myOrders(
                $request->user(),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách order thành công',
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ]
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    // =========================
    // GET /api/orders/{id}
    // =========================
    public function show(Request $request, $id)
    {
        try {

            $order = $this->orderQueryService->show(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => "Lấy chi tiết order thành công",
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    // =========================
    // POST /api/orders/{id}/cancel
    // =========================
    public function cancel(Request $request, $id)
    {
        try {

            $order = $this->orderQueryService->cancel(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Hủy order thành công',
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }

    // =========================
    // POST /api/orders/{id}/confirm
    // =========================
    public function confirm(Request $request, $id)
    {
        try {

            $order = $this->orderQueryService->confirm(
                $request->user(),
                $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Xác nhận nhận hàng thành công',
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 400);
        }
    }
}