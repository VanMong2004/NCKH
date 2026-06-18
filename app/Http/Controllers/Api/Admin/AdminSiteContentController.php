<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminSiteContentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminSiteContentController extends Controller
{
    public function __construct(
        protected AdminSiteContentService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'page_key' => 'nullable|string|max:100',
                'component_key' => 'nullable|string|max:100',
                'component_type' => 'nullable|string|max:80',
                'is_active' => 'nullable|boolean',
                'keyword' => 'nullable|string|max:255',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách nội dung giao diện thành công',
                'data' => $this->service->index($filters),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content index error');
        }
    }

    public function show($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết nội dung giao diện thành công',
                'data' => $this->service->show((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content show error');
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate($this->componentRules());

            return response()->json([
                'success' => true,
                'message' => 'Tạo component nội dung thành công',
                'data' => $this->service->store($data),
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content store error');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate($this->componentRules(partial: true));

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật component nội dung thành công',
                'data' => $this->service->update((int) $id, $data),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content update error');
        }
    }

    public function destroy($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Xóa component nội dung thành công',
                'data' => $this->service->destroy((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content destroy error');
        }
    }

    public function toggle($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái component nội dung thành công',
                'data' => $this->service->toggle((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content toggle error');
        }
    }

    public function storeItem(Request $request, $id)
    {
        try {
            $data = $request->validate($this->itemRules());

            return response()->json([
                'success' => true,
                'message' => 'Tạo item nội dung thành công',
                'data' => $this->service->storeItem((int) $id, $data),
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content item store error');
        }
    }

    public function updateItem(Request $request, $itemId)
    {
        try {
            $data = $request->validate($this->itemRules(partial: true));

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật item nội dung thành công',
                'data' => $this->service->updateItem((int) $itemId, $data),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content item update error');
        }
    }

    public function destroyItem($itemId)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Xóa item nội dung thành công',
                'data' => $this->service->destroyItem((int) $itemId),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content item destroy error');
        }
    }

    public function toggleItem($itemId)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái item nội dung thành công',
                'data' => $this->service->toggleItem((int) $itemId),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content item toggle error');
        }
    }

    public function reorderItems(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'items' => 'required|array',
                'items.*.id' => 'required|integer',
                'items.*.sort_order' => 'required|integer|min:0',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sắp xếp item nội dung thành công',
                'data' => $this->service->reorderItems((int) $id, $data['items']),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin site content item reorder error');
        }
    }

    private function componentRules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';
        $nullable = $partial ? 'sometimes|nullable' : 'nullable';

        return [
            'page_key' => $nullable . '|string|max:100',
            'page_name' => $nullable . '|string|max:150',

            'component_key' => $required . '|string|max:100',
            'component_name' => $required . '|string|max:150',
            'component_type' => $nullable . '|string|max:80',

            'title' => $nullable . '|string|max:255',
            'subtitle' => $nullable . '|string|max:255',
            'content' => $nullable . '|string',

            'image' => $nullable . '|string|max:255',
            'mobile_image' => $nullable . '|string|max:255',

            'payload' => $nullable,

            'sort_order' => $nullable . '|integer|min:0',
            'is_active' => $nullable . '|boolean',
        ];
    }

    private function itemRules(bool $partial = false): array
    {
        $nullable = $partial ? 'sometimes|nullable' : 'nullable';

        return [
            'parent_id' => $nullable . '|integer',

            'group_key' => $nullable . '|string|max:100',
            'item_key' => $nullable . '|string|max:100',
            'item_type' => $nullable . '|string|max:80',

            'label' => $nullable . '|string|max:255',
            'title' => $nullable . '|string|max:255',
            'subtitle' => $nullable . '|string|max:255',
            'content' => $nullable . '|string',

            'icon_key' => $nullable . '|string|max:100',

            'image' => $nullable . '|string|max:255',
            'mobile_image' => $nullable . '|string|max:255',

            'link_text' => $nullable . '|string|max:255',
            'link_url' => $nullable . '|string|max:255',
            'target' => $nullable . '|string|max:30',

            'payload' => $nullable,

            'sort_order' => $nullable . '|integer|min:0',
            'is_active' => $nullable . '|boolean',
        ];
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Dữ liệu nội dung giao diện không hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function businessError(RuntimeException $e)
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], $e->getCode() ?: 400);
    }

    private function systemError(Throwable $e, string $logMessage)
    {
        Log::error($logMessage, [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống',
            'data' => null,
        ], 500);
    }
}