<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminPolicyService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminPolicyController extends Controller
{
    public function __construct(
        protected AdminPolicyService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'type' => 'nullable|string|max:100',
                'is_active' => 'nullable|boolean',
                'sort' => 'nullable|string|in:latest,oldest,sort_order_asc',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ], $this->messages());

            return response()->json($this->service->index($filters));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Bộ lọc chính sách không hợp lệ');
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách chính sách',
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
                'message' => 'Lỗi khi lấy chi tiết chính sách',
                'data' => null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255',
                'type' => 'required|string|max:100',
                'content' => 'required|string',
                'sort_order' => 'nullable|integer|min:0|max:999999',
                'is_active' => 'nullable|boolean',
            ], $this->messages());

            return response()->json($this->service->store($data), 201);
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu chính sách không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi tạo chính sách',
                'data' => null,
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255',
                'type' => 'required|string|max:100',
                'content' => 'required|string',
                'sort_order' => 'nullable|integer|min:0|max:999999',
                'is_active' => 'nullable|boolean',
            ], $this->messages());

            return response()->json($this->service->update((int) $id, $data));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Dữ liệu chính sách không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật chính sách',
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
                'message' => 'Lỗi khi xóa chính sách',
                'data' => null,
            ], 500);
        }
    }

    public function toggleActive($id)
    {
        try {
            return response()->json($this->service->toggleActive((int) $id));
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi đổi trạng thái chính sách',
                'data' => null,
            ], 500);
        }
    }

    private function messages(): array
    {
        return [
            'title.required' => 'Vui lòng nhập tiêu đề chính sách',
            'title.max' => 'Tiêu đề chính sách không được vượt quá 255 ký tự',
            'slug.max' => 'Slug không được vượt quá 255 ký tự',
            'type.required' => 'Vui lòng nhập loại chính sách',
            'type.max' => 'Loại chính sách không được vượt quá 100 ký tự',
            'content.required' => 'Vui lòng nhập nội dung chính sách',
            'sort_order.integer' => 'Thứ tự sắp xếp phải là số nguyên',
            'sort_order.min' => 'Thứ tự sắp xếp không được nhỏ hơn 0',
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
