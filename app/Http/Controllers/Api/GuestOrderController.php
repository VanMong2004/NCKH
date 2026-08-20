<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GuestCheckoutGuardService;
use App\Services\GuestOrderService;
use App\Services\VatInvoiceRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class GuestOrderController extends Controller
{
    public function __construct(
        protected GuestOrderService $service,
        protected VatInvoiceRequestService $vatInvoiceRequestService,
        protected GuestCheckoutGuardService $guestCheckoutGuardService
    ) {}

    public function lookup(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'order_code' => 'nullable|string',
                'phone' => ['nullable', 'regex:/^0\d{9}$/'],
                'email' => 'required|email|max:255',
            ], [
                'phone.regex' => 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0.',
            ]);

            $data['email'] = $this->guestCheckoutGuardService->normalizeEmail($data['email'] ?? '');

            if (!empty($data['phone'])) {
                $data['phone'] = $this->guestCheckoutGuardService->normalizePhone($data['phone']);
            }

            $hasOrderCode = !empty($data['order_code']);
            $hasPhone = !empty($data['phone']);

            if ($hasOrderCode === $hasPhone) {
                throw ValidationException::withMessages([
                    'lookup' => [
                        'Vui lòng nhập `order_code + email` hoặc `phone + email`.',
                    ],
                ]);
            }

            $order = $this->service->lookup($data);

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
            ], in_array($e->getCode(), [400, 404], true) ? $e->getCode() : 404);
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

            $order = $this->service->showByCode($user, $guestToken, $orderCode);

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
            ], in_array($e->getCode(), [400, 401, 403, 404], true) ? $e->getCode() : 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function vatInvoiceRequest(Request $request, string $orderCode): JsonResponse
    {
        try {
            $user = auth('sanctum')->user();
            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Lấy yêu cầu hóa đơn giá trị gia tăng thành công',
                'data' => $this->vatInvoiceRequestService->showForGuest(
                    $user,
                    $guestToken,
                    $orderCode
                ),
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 403, 404], true) ? $e->getCode() : 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function storeVatInvoiceRequest(Request $request, string $orderCode): JsonResponse
    {
        try {
            $data = $request->validate([
                'company_name' => 'required|string|max:255',
                'tax_code' => ['required', 'regex:/^\d{10,13}$/'],
                'company_address' => 'required|string|max:500',
                'invoice_email' => 'required|email|max:255',
                'note' => 'nullable|string|max:1000',
            ], [
                'tax_code.required' => 'Vui lòng nhập mã số thuế.',
                'tax_code.regex' => 'Mã số thuế phải gồm từ 10 đến 13 chữ số.',
            ]);

            $user = auth('sanctum')->user();
            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Gửi yêu cầu hóa đơn giá trị gia tăng thành công',
                'data' => $this->vatInvoiceRequestService->createForGuest(
                    $user,
                    $guestToken,
                    $orderCode,
                    $data
                ),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu hóa đơn giá trị gia tăng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 403, 404, 409], true) ? $e->getCode() : 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function cancel(Request $request, string $orderCode): JsonResponse
    {
        try {
            $data = $request->validate([
                'email' => 'required|email|max:255',
            ]);

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Hủy đơn hàng thành công',
                'data' => $this->service->cancel(
                    $guestToken,
                    $orderCode,
                    $this->guestCheckoutGuardService->normalizeEmail($data['email'])
                ),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu hủy đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 404, 409], true) ? $e->getCode() : 400);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}
