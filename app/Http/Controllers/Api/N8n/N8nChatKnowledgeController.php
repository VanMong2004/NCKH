<?php

namespace App\Http\Controllers\Api\N8n;

use App\Http\Controllers\Controller;
use App\Services\Chat\OpenAiVectorStoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class N8nChatKnowledgeController extends Controller
{
    public function __construct(
        protected OpenAiVectorStoreService $service
    ) {}

    public function syncStatus(Request $request)
    {
        try {
            $this->verifyN8nSecret($request);

            $data = $request->validate([
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đồng bộ trạng thái tài liệu tri thức thành công',
                'data' => $this->service->syncProcessingKnowledgeFiles(
                    $data['limit'] ?? null
                ),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đồng bộ không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $e->getCode() ?: 400);
        } catch (Throwable $e) {
            Log::error('N8N sync chat knowledge status error', [
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

    private function verifyN8nSecret(Request $request): void
    {
        $expectedSecret = config('services.n8n.ai_sync_secret');

        if (!$expectedSecret) {
            throw new RuntimeException('Chưa cấu hình N8N_AI_SYNC_SECRET', 500);
        }

        $givenSecret = $request->header('N8N_AI_SYNC_SECRET')
            ?: $request->query('token');

        if (!$givenSecret || !hash_equals($expectedSecret, (string) $givenSecret)) {
            throw new RuntimeException('Không có quyền đồng bộ dữ liệu', 403);
        }
    }
}