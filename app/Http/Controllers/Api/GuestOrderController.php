<?php

namespace App\Http\Controllers\Api;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\GuestOrderService;
use App\Services\OrderBillService;
use App\Services\VatInvoiceRequestService;
use Illuminate\Validation\ValidationException;

class GuestOrderController extends Controller
{
    public function __construct(
        protected GuestOrderService $service,
        protected OrderBillService $orderBillService,
        protected VatInvoiceRequestService $vatInvoiceRequestService
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

    public function bill(Request $request, string $orderCode)
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return $this->orderBillService->downloadForGuest(
                $user,
                $guestToken,
                $orderCode
            );

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

    public function vatInvoiceRequest(Request $request, string $orderCode): JsonResponse
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Lấy yêu cầu hóa đơn đỏ thành công',
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
            ], in_array($e->getCode(), [400, 401, 403, 404]) ? $e->getCode() : 400);

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
                'tax_code' => 'required|string|max:50',
                'company_address' => 'required|string|max:500',
                'invoice_email' => 'required|email|max:255',
                'note' => 'nullable|string|max:1000',
            ], [
                'company_name.required' => 'Vui lòng nhập tên đơn vị xuất hóa đơn',
                'tax_code.required' => 'Vui lòng nhập mã số thuế',
                'company_address.required' => 'Vui lòng nhập địa chỉ xuất hóa đơn',
                'invoice_email.required' => 'Vui lòng nhập email nhận hóa đơn',
                'invoice_email.email' => 'Email nhận hóa đơn không đúng định dạng',
            ]);

            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Gửi yêu cầu hóa đơn đỏ thành công',
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
                'message' => 'Dữ liệu hóa đơn đỏ không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 403, 404, 409]) ? $e->getCode() : 400);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function downloadVatInvoice(Request $request, string $orderCode)
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return $this->vatInvoiceRequestService->downloadForGuest(
                $user,
                $guestToken,
                $orderCode
            );

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], in_array($e->getCode(), [400, 401, 403, 404, 409]) ? $e->getCode() : 400);

        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}
