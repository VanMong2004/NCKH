<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminChatApprovedAnswerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminChatApprovedAnswerController extends Controller
{
    public function __construct(
        protected AdminChatApprovedAnswerService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => 'nullable|string|in:draft,approved',
                'is_active' => 'nullable|boolean',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy thư viện câu trả lời duyệt sẵn thành công',
                'data' => $this->service->list($filters),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers index error');
        }
    }

    public function show(int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết câu trả lời duyệt sẵn thành công',
                'data' => $this->service->show($id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers show error');
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'question' => 'required|string|max:2000',
                'answer' => 'required|string|max:10000',
                'intent' => 'nullable|string|max:100',
                'intent_signature' => 'nullable|string|max:255',
                'entities_json' => 'nullable|array',
                'status' => 'nullable|string|in:draft,approved',
                'is_active' => 'nullable|boolean',
                'effective_from' => 'nullable|date',
                'effective_to' => 'nullable|date',
                'source_type' => 'nullable|string|max:120',
                'source_reference' => 'nullable|string|max:255',
            ], [
                'question.required' => 'Vui lòng nhập câu hỏi mẫu.',
                'answer.required' => 'Vui lòng nhập câu trả lời đã duyệt.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tạo câu trả lời duyệt sẵn thành công',
                'data' => $this->service->store($data, $request->user()),
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers store error');
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $data = $request->validate([
                'question' => 'sometimes|required|string|max:2000',
                'answer' => 'sometimes|required|string|max:10000',
                'intent' => 'nullable|string|max:100',
                'intent_signature' => 'nullable|string|max:255',
                'entities_json' => 'nullable|array',
                'status' => 'nullable|string|in:draft,approved',
                'is_active' => 'nullable|boolean',
                'effective_from' => 'nullable|date',
                'effective_to' => 'nullable|date',
                'source_type' => 'nullable|string|max:120',
                'source_reference' => 'nullable|string|max:255',
            ], [
                'question.required' => 'Vui lòng nhập câu hỏi mẫu.',
                'answer.required' => 'Vui lòng nhập câu trả lời đã duyệt.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật câu trả lời duyệt sẵn thành công',
                'data' => $this->service->update($id, $data, $request->user()),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers update error');
        }
    }

    public function toggle(int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái hoạt động thành công',
                'data' => $this->service->toggle($id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers toggle error');
        }
    }

    public function destroy(int $id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Xóa câu trả lời duyệt sẵn thành công',
                'data' => $this->service->destroy($id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers destroy error');
        }
    }

    public function promote(int $messageId, Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Đã tạo bản nháp từ hội thoại AI',
                'data' => $this->service->promoteFromMessage($messageId, $request->user()),
            ], 201);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat approved answers promote error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Dữ liệu thư viện câu trả lời chưa hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function businessError(RuntimeException $e)
    {
        $status = is_int($e->getCode()) && $e->getCode() >= 100 && $e->getCode() <= 599
            ? $e->getCode()
            : 400;

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], $status);
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
