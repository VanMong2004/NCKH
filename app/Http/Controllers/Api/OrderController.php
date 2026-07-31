<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsEventService;
use App\Services\OrderQueryService;
use App\Services\OrderService;
use App\Services\VatInvoiceRequestService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected OrderQueryService $orderQueryService,
        protected VatInvoiceRequestService $vatInvoiceRequestService,
        protected AnalyticsEventService $analyticsEventService
    ) {}

    public function checkout(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $rules = [
                'address_id' => 'nullable|integer|exists:addresses,id',
                'guest_name' => 'nullable|string|max:255',
                'guest_email' => 'nullable|email|max:255',
                'guest_phone' => ['nullable', 'regex:/^0\d{9}$/'],
                'province' => 'nullable|string|max:255',
                'district' => 'nullable|string|max:255',
                'ward' => 'nullable|string|max:255',
                'address_line' => 'nullable|string|max:500',
                'postal_code' => 'nullable|string|max:20',
                'save_address' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',
                'fulfillment_method' => 'required|in:delivery,pickup',
                'payment_method' => 'required|in:cod,mock_bank,cash_on_pickup',
                'cart_item_ids' => 'required|array|min:1',
                'cart_item_ids.*' => 'required|integer|exists:cart_items,id',
            ];

            if (!$user) {
                $rules['guest_name'] = 'required|string|max:255';
                $rules['guest_email'] = 'required|email|max:255';
                $rules['guest_phone'] = ['required', 'regex:/^0\d{9}$/'];
            }

            if ($request->input('fulfillment_method') === 'delivery') {
                if (!$user || !$request->filled('address_id')) {
                    $rules['province'] = 'required|string|max:255';
                    $rules['district'] = 'required|string|max:255';
                    $rules['ward'] = 'required|string|max:255';
                    $rules['address_line'] = 'required|string|max:500';
                }
            }

            $data = $request->validate($rules, [
                'address_id.integer' => 'Địa chỉ giao hàng không hợp lệ.',
                'address_id.exists' => 'Địa chỉ giao hàng không tồn tại.',
                'guest_name.required' => 'Vui lòng nhập tên người nhận.',
                'guest_name.string' => 'Tên người nhận không hợp lệ.',
                'guest_name.max' => 'Tên người nhận không được vượt quá 255 ký tự.',
                'guest_email.required' => 'Vui lòng nhập email.',
                'guest_email.email' => 'Email không đúng định dạng.',
                'guest_email.max' => 'Email không được vượt quá 255 ký tự.',
                'guest_phone.required' => 'Vui lòng nhập số điện thoại người nhận.',
                'guest_phone.regex' => 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0.',
                'province.required' => 'Vui lòng nhập tỉnh/thành phố.',
                'district.required' => 'Vui lòng nhập quận/huyện.',
                'ward.required' => 'Vui lòng nhập phường/xã.',
                'address_line.required' => 'Vui lòng nhập địa chỉ giao hàng.',
                'postal_code.max' => 'Mã bưu điện không được vượt quá 20 ký tự.',
                'fulfillment_method.required' => 'Vui lòng chọn phương thức nhận hàng.',
                'fulfillment_method.in' => 'Phương thức nhận hàng không hợp lệ.',
                'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.',
                'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',
                'cart_item_ids.required' => 'Vui lòng chọn sản phẩm cần thanh toán.',
                'cart_item_ids.array' => 'Danh sách sản phẩm không hợp lệ.',
                'cart_item_ids.min' => 'Vui lòng chọn ít nhất một sản phẩm.',
                'cart_item_ids.*.required' => 'Sản phẩm trong giỏ hàng không hợp lệ.',
                'cart_item_ids.*.integer' => 'Sản phẩm trong giỏ hàng không hợp lệ.',
                'cart_item_ids.*.exists' => 'Có sản phẩm không tồn tại trong giỏ hàng.',
            ]);

            $this->analyticsEventService->trackCheckoutStarted(
                $request,
                array_map('intval', $data['cart_item_ids'])
            );

            $result = $this->orderService->checkout(
                $user,
                $request->header('X-Guest-Token'),
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Đặt hàng thành công',
                'data' => $result,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đặt hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409, 422], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (QueryException $e) {
            Log::error('Checkout database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Checkout system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function myOrders(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|max:50',
                'type' => 'nullable|string|max:50',
                'keyword' => 'nullable|string|max:255',
                'sort' => 'nullable|in:latest,oldest',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ]);

            $orders = $this->orderQueryService->myOrders(
                $request->user(),
                $filters
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách đơn hàng thành công',
                'data' => $orders->items(),
                'meta' => [
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (QueryException $e) {
            Log::error('Get my orders database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (Throwable $e) {
            Log::error('Get my orders system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $request->merge(['order_id' => $id]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ]);

            $order = $this->orderQueryService->show(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết đơn hàng thành công',
                'data' => $order,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mã đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (QueryException $e) {
            Log::error('Get order detail database error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (Throwable $e) {
            Log::error('Get order detail system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function vatInvoiceRequest(Request $request, $id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy yêu cầu hóa đơn đỏ thành công',
                'data' => $this->vatInvoiceRequestService->showForUser(
                    $request->user(),
                    (int) $id
                ),
            ]);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (Throwable $e) {
            Log::error('Get VAT invoice request system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function storeVatInvoiceRequest(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'company_name' => 'required|string|max:255',
                'tax_code' => 'required|string|max:50',
                'company_address' => 'required|string|max:500',
                'invoice_email' => 'required|email|max:255',
                'note' => 'nullable|string|max:1000',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gửi yêu cầu hóa đơn đỏ thành công',
                'data' => $this->vatInvoiceRequestService->createForUser(
                    $request->user(),
                    (int) $id,
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
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (Throwable $e) {
            Log::error('Store VAT invoice request system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function cancel(Request $request, $id)
    {
        try {
            $result = $this->orderQueryService->cancel(
                $request->user(),
                (int) $id
            );

            return response()->json([
                'success' => true,
                'message' => 'Hủy đơn hàng thành công',
                'data' => $result,
            ]);
        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409, 422], true)
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);
        } catch (Throwable $e) {
            Log::error('Cancel order system error', ['message' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}
