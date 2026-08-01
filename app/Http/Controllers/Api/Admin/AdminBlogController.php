<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminBlogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminBlogController extends Controller
{
    public function __construct(
        protected AdminBlogService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => 'nullable|string|in:draft,published',
                'is_featured' => 'nullable|boolean',
                'sort' => 'nullable|string|in:latest,oldest,published_desc,published_asc',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
            ], $this->messages());

            return response()->json($this->service->index($filters));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Bo loc bai viet khong hop le');
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Loi khi lay danh sach bai viet',
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
                'message' => 'Loi khi lay chi tiet bai viet',
                'data' => null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'summary' => 'nullable|string|max:1000',
                'content' => 'required|string',
                'thumbnail' => 'nullable|string|max:500',
                'status' => 'required|string|in:draft,published',
                'is_featured' => 'nullable|boolean',
            ], $this->messages());

            $data['author_id'] = $request->user()?->id;

            return response()->json($this->service->store($data), 201);
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Du lieu bai viet khong hop le');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Loi khi tao bai viet',
                'data' => null,
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'title' => 'required|string|max:255',
                'summary' => 'nullable|string|max:1000',
                'content' => 'required|string',
                'thumbnail' => 'nullable|string|max:500',
                'status' => 'required|string|in:draft,published',
                'is_featured' => 'nullable|boolean',
            ], $this->messages());

            return response()->json($this->service->update((int) $id, $data));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Du lieu bai viet khong hop le');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Loi khi cap nhat bai viet',
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
                'message' => 'Loi khi xoa bai viet',
                'data' => null,
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'status' => 'required|string|in:draft,published',
            ], $this->messages());

            return response()->json($this->service->updateStatus((int) $id, $data['status']));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Trang thai bai viet khong hop le');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Loi khi doi trang thai bai viet',
                'data' => null,
            ], 500);
        }
    }

    private function messages(): array
    {
        return [
            'title.required' => 'Vui long nhap tieu de bai viet',
            'title.max' => 'Tieu de bai viet khong duoc vuot qua 255 ky tu',
            'summary.max' => 'Mo ta ngan khong duoc vuot qua 1000 ky tu',
            'content.required' => 'Vui long nhap noi dung bai viet',
            'thumbnail.max' => 'Duong dan anh dai dien khong duoc vuot qua 500 ky tu',
            'status.required' => 'Vui long chon trang thai bai viet',
            'status.in' => 'Trang thai bai viet khong hop le',
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
