<?php

namespace App\Http\Controllers\Api\Admin;

use Throwable;
use RuntimeException;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminPromotionService;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminPromotionController extends Controller
{
    public function __construct(
        protected AdminPromotionService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => 'nullable|in:draft,active,inactive,upcoming,ended',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
            ]);

            return response()->json($this->service->index($filters));

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Bộ lọc khuyến mãi không hợp lệ');
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion index error');
        }
    }

    public function storeItemsBulk(Request $request, $id): JsonResponse
    {
        try {
            $data = $request->validate([
                'items' => 'required|array|min:1',

                'items.*.product_id' => 'required|integer|exists:products,id',

                'items.*.product_variant_id'
                    => 'nullable|integer|exists:product_variants,id',

                'items.*.discount_type'
                    => 'nullable|in:percent,fixed',

                'items.*.discount_value'
                    => 'nullable|numeric|min:0',

                'items.*.limit_quantity'
                    => 'nullable|integer|min:1',

                'items.*.is_active'
                    => 'nullable|boolean',

                'items.*.discount_type' 
                    => 'required|in:percent,fixed',
                
                'items.*.discount_value' 
                    => 'required|numeric|min:0',
            ]);

            return response()->json(
                $this->service->storeItemsBulk(
                    $id,
                    $data['items']
                ),
                201
            );

        } catch (ValidationException $e) {
            return $this->validationError(
                $e,
                'Dữ liệu danh sách sản phẩm khuyến mãi không hợp lệ'
            );

        } catch (RuntimeException $e) {
            return $this->businessError($e);

        } catch (Throwable $e) {
            return $this->systemError(
                $e,
                'Admin promotion bulk item store error'
            );
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate($this->promotionRules());

            $data['banner_file'] = $request->file('banner');
            $data['thumbnail_file'] = $request->file('thumbnail');

            return response()->json(
                $this->service->store($data),
                201
            );

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu tạo khuyến mãi không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion store error');
        }
    }

    public function show($id): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết khuyến mãi thành công',
                'data' => $this->service->show($id),
            ]);

        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion show error');
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $data = $request->validate($this->promotionRules($id));

            $data['banner_file'] = $request->file('banner');
            $data['thumbnail_file'] = $request->file('thumbnail');

            return response()->json(
                $this->service->update($id, $data)
            );

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu cập nhật khuyến mãi không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion update error');
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            return response()->json(
                $this->service->destroy($id)
            );

        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion delete error');
        }
    }

    public function publishSocial($id): JsonResponse
    {
        try {
            return response()->json(
                $this->service->publishSocial($id)
            );

        } catch (RuntimeException $e) {
            return $this->businessError($e);

        } catch (Throwable $e) {
            return $this->systemError(
                $e,
                'Admin promotion publish social error'
            );
        }
    }

    public function items($id): JsonResponse
    {
        try {
            return response()->json(
                $this->service->items($id)
            );

        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion items error');
        }
    }

    public function availableProducts(Request $request, $id): JsonResponse
    {
        try {
            return response()->json(
                $this->service->availableProducts($id, $request)
            );
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion available products error');
        }
    }

    public function storeItem(Request $request, $id): JsonResponse
    {
        try {
            $data = $request->validate($this->itemRules());

            return response()->json(
                $this->service->storeItem($id, $data),
                201
            );

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu sản phẩm khuyến mãi không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion item store error');
        }
    }

    public function updateItem(Request $request, $itemId): JsonResponse
    {
        try {
            $data = $request->validate($this->itemRules(false));

            return response()->json(
                $this->service->updateItem($itemId, $data)
            );

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu cập nhật sản phẩm khuyến mãi không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion item update error');
        }
    }

    public function destroyItem($itemId): JsonResponse
    {
        try {
            return response()->json(
                $this->service->destroyItem($itemId)
            );

        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin promotion item delete error');
        }
    }

    private function promotionRules($id = null): array
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:promotions,slug,' . $id,
            'description' => 'nullable|string',
            'banner' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'discount_type' => 'required|in:percent,fixed',
            'discount_value' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'required|in:draft,active,inactive',
            'is_active' => 'nullable|boolean',
        ];
    }

    private function itemRules(bool $create = true): array
    {
        return [
            'product_id' => ($create ? 'required' : 'sometimes') . '|integer|exists:products,id',
            'product_variant_id' => 'nullable|integer|exists:product_variants,id',
            'discount_type' => 'nullable|in:percent,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'limit_quantity' => 'nullable|integer|min:1',
            'is_active' => 'nullable|boolean',
        ];
    }

    private function validationError(ValidationException $e, string $message): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'error_code' => 'VALIDATION_ERROR',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function businessError(RuntimeException $e): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'error_code' => 'BUSINESS_ERROR',
            'data' => null,
        ], $e->getCode() ?: 400);
    }

    private function systemError(Throwable $e, string $logMessage): JsonResponse
    {
        Log::error($logMessage, [
            'message' => $e->getMessage(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống',
            'error_code' => 'SYSTEM_ERROR',
            'data' => null,
        ], 500);
    }
}