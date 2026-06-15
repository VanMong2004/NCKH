<?php

namespace App\Http\Controllers\Api;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\GuestOrderService;
use Illuminate\Validation\ValidationException;

class GuestOrderController extends Controller
{
    public function __construct(
        protected GuestOrderService $service
    ) {}

    public function lookup(Request $request): JsonResponse
    {
        try {

            $data = $request->validate([
                'order_code' => 'required|string',
                'phone' => 'required|string',
            ]);

            $order = $this->service->lookup(
                $data['order_code'],
                $data['phone']
            );

            return response()->json([
                'success' => true,
                'message' => 'Tra cứu đơn hàng thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu tra cứu không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}