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
                'lookup_type' => 'nullable|string|in:lookup_token,phone_email,order_code_email',
                'lookup_token' => 'nullable|string|max:64',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'order_code' => 'nullable|string|max:50',
            ], [
                'email.email' => 'Email không hợp lệ.',
            ]);

            $lookupType = (string) ($data['lookup_type'] ?? 'lookup_token');

            if ($lookupType === 'phone_email') {
                $errors = [];

                if (trim((string) ($data['phone'] ?? '')) === '') {
                    $errors['phone'] = ['Vui lòng nhập số điện thoại đặt hàng.'];
                }

                if (trim((string) ($data['email'] ?? '')) === '') {
                    $errors['email'] = ['Vui lòng nhập email đặt hàng.'];
                }

                if (!empty($errors)) {
                    throw ValidationException::withMessages($errors);
                }
            } elseif ($lookupType === 'order_code_email') {
                $errors = [];

                if (trim((string) ($data['order_code'] ?? '')) === '') {
                    $errors['order_code'] = ['Vui lòng nhập mã đơn hàng.'];
                }

                if (trim((string) ($data['email'] ?? '')) === '') {
                    $errors['email'] = ['Vui lòng nhập email đặt hàng.'];
                }

                if (!empty($errors)) {
                    throw ValidationException::withMessages($errors);
                }
            } else {
                if (trim((string) ($data['lookup_token'] ?? '')) === '') {
                    throw ValidationException::withMessages([
                        'lookup_token' => ['Vui lòng nhập mã tra cứu đơn hàng.'],
                    ]);
                }
            }

            $data['lookup_token'] = $this->guestCheckoutGuardService->normalizeLookupToken($data['lookup_token'] ?? '');
            $data['lookup_type'] = $lookupType;

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
            $guestLookupToken = $request->header('X-Guest-Lookup-Token')
                ?: $request->query('guest_lookup_token');

            $order = $this->service->showByCode($user, $guestToken, $guestLookupToken, $orderCode);

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
            $guestLookupToken = $request->header('X-Guest-Lookup-Token')
                ?: $request->query('guest_lookup_token');

            return response()->json([
                'success' => true,
                'message' => 'Lấy yêu cầu hóa đơn giá trị gia tăng thành công',
                'data' => $this->vatInvoiceRequestService->showForGuest(
                    $user,
                    $guestToken,
                    $guestLookupToken,
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
            $guestLookupToken = $request->header('X-Guest-Lookup-Token')
                ?: $request->query('guest_lookup_token');

            return response()->json([
                'success' => true,
                'message' => 'Gửi yêu cầu hóa đơn giá trị gia tăng thành công',
                'data' => $this->vatInvoiceRequestService->createForGuest(
                    $user,
                    $guestToken,
                    $guestLookupToken,
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
            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');
            $guestLookupToken = $request->header('X-Guest-Lookup-Token')
                ?: $request->query('guest_lookup_token')
                ?: $request->input('lookup_token');

            return response()->json([
                'success' => true,
                'message' => 'Hủy đơn hàng thành công',
                'data' => $this->service->cancel(
                    $guestToken,
                    $guestLookupToken,
                    $orderCode,
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
