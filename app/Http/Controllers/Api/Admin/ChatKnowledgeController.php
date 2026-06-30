<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Chat\OpenAiVectorStoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ChatKnowledgeController extends Controller
{
    public function __construct(
        protected OpenAiVectorStoreService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'status' => 'nullable|string|in:pending,processing,completed,failed,cancelled',
                'is_active' => 'nullable|boolean',
                'keyword' => 'nullable|string|max:255',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách tài liệu tri thức thành công',
                'data' => $this->service->listKnowledgeFiles($filters),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Chat knowledge index error');
        }
    }

    public function show($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết tài liệu tri thức thành công',
                'data' => $this->service->showKnowledgeFile((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Chat knowledge show error');
        }
    }

    public function upload(Request $request)
    {
        try {
            $data = $request->validate([
                'file' => 'required|file|mimes:pdf,doc,docx,txt,md|max:20480',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'document_key' => 'nullable|string|max:120',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Upload tài liệu tri thức thành công',
                'data' => $this->service->uploadStaticKnowledgeFile(
                    $request->file('file'),
                    $request->user(),
                    $data
                ),
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Chat knowledge upload error');
        }
    }

    public function toggle($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái tài liệu tri thức thành công',
                'data' => $this->service->toggleKnowledgeFile((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Chat knowledge toggle error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Tài liệu không hợp lệ',
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

    public function destroy($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Xóa tài liệu tri thức thành công',
                'data' => $this->service->deleteKnowledgeFile((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Chat knowledge delete error');
        }
    }
}
