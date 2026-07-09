<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminContactService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminContactController extends Controller
{
    public function __construct(
        protected AdminContactService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => ['nullable', 'string', Rule::in(['pending', 'processing', 'replied', 'closed'])],
                'subject' => 'nullable|string|max:255',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'sort' => 'nullable|string|in:latest,oldest',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'with_deleted' => 'nullable|boolean',
            ], $this->messages());

            return response()->json($this->service->index($filters));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Bộ lọc liên hệ không hợp lệ');
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách liên hệ',
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
                'message' => 'Lỗi khi lấy chi tiết liên hệ',
                'data' => null,
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(['pending', 'processing', 'replied', 'closed'])],
            ], $this->messages());

            return response()->json($this->service->updateStatus((int) $id, $data['status']));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Trạng thái liên hệ không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi cập nhật trạng thái liên hệ',
                'data' => null,
            ], 500);
        }
    }

    public function updateNote(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'admin_note' => 'nullable|string|max:5000',
            ], $this->messages());

            return response()->json($this->service->updateNote((int) $id, $data['admin_note'] ?? null));
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Ghi chú liên hệ không hợp lệ');
        } catch (RuntimeException $e) {
            return $this->runtimeError($e);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lưu ghi chú liên hệ',
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
                'message' => 'Lỗi khi xóa liên hệ',
                'data' => null,
            ], 500);
        }
    }

    private function messages(): array
    {
        return [
            'status.required' => 'Vui lòng chọn trạng thái liên hệ',
            'status.in' => 'Trạng thái liên hệ không hợp lệ',
            'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',
            'subject.max' => 'Chủ đề không được vượt quá 255 ký tự',
            'date_from.date' => 'Ngày bắt đầu không hợp lệ',
            'date_to.date' => 'Ngày kết thúc không hợp lệ',
            'admin_note.max' => 'Ghi chú nội bộ không được vượt quá 5000 ký tự',
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
