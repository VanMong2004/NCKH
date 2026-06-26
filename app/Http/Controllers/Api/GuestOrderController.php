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

    public function showByCode(Request $request, string $orderCode): JsonResponse
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            $order = $this->service->showByCode(
                $user,
                $guestToken,
                $orderCode
            );

            return response()->json([
                'success' => true,
                'message' => 'Tra cứu đơn hàng thành công',
                'data' => $order,
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 403, 404]) ? $e->getCode() : 400);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}