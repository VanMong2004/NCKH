<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminCategoryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminCategoryController extends Controller
{
    public function __construct(
        protected AdminCategoryService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'parent_id' => 'nullable',
                'is_active' => 'nullable|boolean',
                'sort' => 'nullable|string|in:latest,oldest,name,sort_order',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'with_deleted' => 'nullable|boolean',
            ], $this->messages());

            return response()->json($this->service->index($filters));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Bộ lọc danh mục không hợp lệ');
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate($this->rules(), $this->messages());

            return response()->json($this->service->store($data));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu danh mục không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi thêm danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            return response()->json($this->service->show((int) $id));
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate($this->rules((int) $id), $this->messages());

            return response()->json($this->service->update((int) $id, $data));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu danh mục không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function toggleActive(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'is_active' => 'required|boolean',
            ], $this->messages());

            return response()->json($this->service->toggleActive((int) $id, (bool) $data['is_active']));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Trạng thái danh mục không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            return response()->json($this->service->destroy((int) $id));
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa danh mục',
                'data' => null,
            ], 500);
        }
    }

    public function activeOptions()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách danh mục đang bật thành công',
            'data' => $this->service->activeOptions(),
        ]);
    }

    private function rules(?int $id = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($id),
            ],
            'parent_id' => 'nullable|integer|exists:categories,id',
            'description' => 'nullable|string|max:5000',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0',
        ];
    }

    private function messages(): array
    {
        return [
            'name.required' => 'Vui lòng nhập tên danh mục',
            'name.max' => 'Tên danh mục không được vượt quá 255 ký tự',
            'slug.unique' => 'Slug danh mục đã tồn tại',
            'parent_id.exists' => 'Danh mục cha không tồn tại',
            'is_active.required' => 'Vui lòng truyền trạng thái danh mục',
            'is_active.boolean' => 'Trạng thái danh mục không hợp lệ',
            'sort_order.integer' => 'Thứ tự hiển thị không hợp lệ',
            'description.max' => 'Mô tả không được vượt quá 5000 ký tự',
        ];
    }

    private function validationError(ValidationException $e, string $fallback)
    {
        $firstError = collect($e->errors())->flatten()->first();

        return response()->json([
            'success' => false,
            'message' => $firstError ?: $fallback,
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function runtimeError(RuntimeException $e)
    {
        $code = $e->getCode();

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], in_array($code, [400, 404, 409, 422], true) ? $code : 400);
    }
}
