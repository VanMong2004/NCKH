<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\OrderQueryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class OrderController extends Controller
{
    protected $orderService;
    protected $orderQueryService;

    public function __construct(OrderService $orderService, OrderQueryService $orderQueryService)
    {
        $this->orderService = $orderService;
        $this->orderQueryService = $orderQueryService;
    }

    // POST /api/orders/checkout
    public function checkout(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $rules = [
                'address_id' => 'nullable|integer|exists:addresses,id',

                'guest_name' => 'nullable|string|max:255',
                'guest_email' => 'nullable|email|max:255',
                'guest_phone' => 'nullable|string|max:20',

                'province' => 'nullable|string|max:255',
                'district' => 'nullable|string|max:255',
                'ward' => 'nullable|string|max:255',
                'address_line' => 'nullable|string|max:500',
                'postal_code' => 'nullable|string|max:20',

                'save_address' => 'nullable|boolean',
                'is_default' => 'nullable|boolean',

                'payment_method' => 'required|in:cod,vnpay,mock',

                'cart_item_ids' => 'required|array|min:1',
                'cart_item_ids.*' => 'required|integer|exists:cart_items,id',
            ];

            // Guest chưa đăng nhập thì bắt buộc nhập thông tin nhận hàng
            if (!$user) {
                $rules['guest_name'] = 'required|string|max:255';
                $rules['guest_email'] = 'required|email|max:255';
                $rules['guest_phone'] = 'required|string|max:20';

                $rules['province'] = 'required|string|max:255';
                $rules['district'] = 'required|string|max:255';
                $rules['ward'] = 'required|string|max:255';
                $rules['address_line'] = 'required|string|max:500';
            }

            // User login nhưng không chọn address_id thì phải nhập địa chỉ mới
            if ($user && !$request->filled('address_id')) {
                $rules['province'] = 'required|string|max:255';
                $rules['district'] = 'required|string|max:255';
                $rules['ward'] = 'required|string|max:255';
                $rules['address_line'] = 'required|string|max:500';
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
                'guest_phone.string' => 'Số điện thoại không hợp lệ.',
                'guest_phone.max' => 'Số điện thoại không được vượt quá 20 ký tự.',

                'province.required' => 'Vui lòng nhập tỉnh/thành phố.',
                'province.string' => 'Tỉnh/thành phố không hợp lệ.',
                'province.max' => 'Tỉnh/thành phố không được vượt quá 255 ký tự.',

                'district.required' => 'Vui lòng nhập quận/huyện.',
                'district.string' => 'Quận/huyện không hợp lệ.',
                'district.max' => 'Quận/huyện không được vượt quá 255 ký tự.',

                'ward.required' => 'Vui lòng nhập phường/xã.',
                'ward.string' => 'Phường/xã không hợp lệ.',
                'ward.max' => 'Phường/xã không được vượt quá 255 ký tự.',

                'address_line.required' => 'Vui lòng nhập địa chỉ giao hàng.',
                'address_line.string' => 'Địa chỉ giao hàng không hợp lệ.',
                'address_line.max' => 'Địa chỉ không được vượt quá 500 ký tự.',

                'postal_code.max' => 'Mã bưu điện không được vượt quá 20 ký tự.',

                'payment_method.required' => 'Vui lòng chọn phương thức thanh toán.',
                'payment_method.in' => 'Phương thức thanh toán không hợp lệ.',

                'cart_item_ids.required' => 'Vui lòng chọn sản phẩm cần thanh toán.',
                'cart_item_ids.array' => 'Danh sách sản phẩm không hợp lệ.',
                'cart_item_ids.min' => 'Vui lòng chọn ít nhất một sản phẩm.',

                'cart_item_ids.*.required' => 'Sản phẩm trong giỏ hàng không hợp lệ.',
                'cart_item_ids.*.integer' => 'Sản phẩm trong giỏ hàng không hợp lệ.',
                'cart_item_ids.*.exists' => 'Có sản phẩm không tồn tại trong giỏ hàng.',
            ]);

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
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Checkout database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Checkout system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // GET /api/orders/my-orders
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
            ], [
                'status.string' => 'Trạng thái đơn hàng không hợp lệ',
                'status.max' => 'Trạng thái đơn hàng không hợp lệ',

                'type.string' => 'Loại đơn hàng không hợp lệ',
                'type.max' => 'Loại đơn hàng không hợp lệ',

                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',

                'sort.in' => 'Kiểu sắp xếp không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số đơn hàng mỗi trang không hợp lệ',
                'per_page.min' => 'Số đơn hàng mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $orders = $this->orderQueryService->myOrders(
                $request->user(),
                $filters
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
            Log::error('Get my orders database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Get my orders system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // GET /api/orders/{id}
    public function show(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
            ]);

            $order = $this->orderQueryService->show(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết order thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Get order detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Get order detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // POST /api/orders/{id}/cancel
    public function cancel(Request $request, $id)
    {
        try {
            $request->merge([
                'order_id' => $id,
            ]);

            $data = $request->validate([
                'order_id' => 'required|integer|min:1',
            ], [
                'order_id.required' => 'Đơn hàng không hợp lệ',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.min' => 'Đơn hàng không hợp lệ',
            ]);

            $order = $this->orderQueryService->cancel(
                $request->user(),
                $data['order_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Hủy order thành công',
                'data' => $order,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đơn hàng không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Cancel order database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Cancel order system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }    
}