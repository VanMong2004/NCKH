<?php

namespace App\Http\Controllers\Api\Admin;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminOrderService;
use Illuminate\Validation\ValidationException;

class AdminOrderController extends Controller
{
    public function __construct(
        protected AdminOrderService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|in:pending,processing,awaiting_receipt,completed,cancelled',
                'payment_status' => 'nullable|string|in:unpaid,paid,failed,refunded',
                'vat_invoice_status' => 'nullable|string|in:none,pending,processing,fulfilled,rejected',
                'customer_type' => 'nullable|string|in:user,guest',
                'keyword' => 'nullable|string|max:255',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort' => 'nullable|string|in:latest,oldest',
            ]);

            return response()->json(
                $this->service->index($filters)
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc đơn hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách đơn hàng',
                'data' => null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            return response()->json(
                $this->service->show((int) $id)
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết đơn hàng',
                'data' => null,
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'status' => 'required|string|in:processing,awaiting_receipt,completed,cancelled',
                'cancel_reason' => 'nullable|string|max:255',
                'note' => 'nullable|string|max:500',
            ]);

            return response()->json(
                $this->service->updateStatus(
                    (int) $id,
                    $data,
                    $request->user()
                )
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Trạng thái đơn hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái đơn hàng',
                'data' => null,
            ], 500);
        }
    }

    public function updateVatInvoiceStatus(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'status' => 'required|string|in:processing,fulfilled,rejected',
                'admin_note' => 'nullable|string|max:1000',
            ]);

            return response()->json(
                $this->service->updateVatInvoiceStatus(
                    (int) $id,
                    $data,
                    $request->user()
                )
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Trạng thái hóa đơn giá trị gia tăng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái hóa đơn giá trị gia tăng',
                'data' => null,
            ], 500);
        }
    }

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
