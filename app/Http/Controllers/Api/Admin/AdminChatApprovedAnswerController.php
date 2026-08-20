<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminChatApprovedAnswerService;
use Illuminate\Http\Request;
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
    }

    public function show(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết câu trả lời duyệt sẵn thành công',
            'data' => $this->service->show($id),
        ]);
    }

    public function store(Request $request)
    {
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
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tạo câu trả lời duyệt sẵn thành công',
            'data' => $this->service->store($data, $request->user()),
        ], 201);
    }

    public function update(Request $request, int $id)
    {
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
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật câu trả lời duyệt sẵn thành công',
            'data' => $this->service->update($id, $data, $request->user()),
        ]);
    }

    public function toggle(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái hoạt động thành công',
            'data' => $this->service->toggle($id),
        ]);
    }

    public function destroy(int $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Xóa câu trả lời duyệt sẵn thành công',
            'data' => $this->service->destroy($id),
        ]);
    }

    public function promote(int $messageId, Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đã tạo bản nháp từ hội thoại AI',
            'data' => $this->service->promoteFromMessage($messageId, $request->user()),
        ], 201);
    }
}
