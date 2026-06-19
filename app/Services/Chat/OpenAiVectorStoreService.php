<?php

namespace App\Services\Chat;

use App\Models\ChatKnowledgeFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class OpenAiVectorStoreService
{
    public function listKnowledgeFiles(array $filters = [])
    {
        $query = ChatKnowledgeFile::query()
            ->latest();

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('original_name', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        return $query->get()
            ->map(fn ($file) => $this->formatKnowledgeFile($file))
            ->values();
    }

    public function showKnowledgeFile(int $id): array
    {
        $file = ChatKnowledgeFile::query()->find($id);

        if (!$file) {
            throw new RuntimeException('Không tìm thấy tài liệu tri thức', 404);
        }

        return $this->formatKnowledgeFile($file);
    }

    public function uploadStaticKnowledgeFile(UploadedFile $file, $user = null, array $data = []): array
    {
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');
        $vectorStoreId = config('services.openai.vector_store_id');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        if (!$vectorStoreId) {
            throw new RuntimeException('Chưa cấu hình OPENAI_VECTOR_STORE_ID', 500);
        }

        $knowledgeFile = ChatKnowledgeFile::create([
            'title' => $data['title'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'description' => $data['description'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => (int) $file->getSize(),
            'vector_store_id' => $vectorStoreId,
            'status' => 'processing',
            'is_active' => true,
            'uploaded_by' => $user?->id,
            'metadata' => [
                'source' => 'admin_upload',
            ],
        ]);

        try {
            $uploadedFile = Http::withToken($apiKey)
                ->attach(
                    'file',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                )
                ->post($baseUrl . '/files', [
                    'purpose' => 'assistants',
                ])
                ->throw()
                ->json();

            $openaiFileId = $uploadedFile['id'] ?? null;

            if (!$openaiFileId) {
                throw new RuntimeException('OpenAI không trả về file id', 500);
            }

            $vectorFile = Http::withToken($apiKey)
                ->acceptJson()
                ->post($baseUrl . "/vector_stores/{$vectorStoreId}/files", [
                    'file_id' => $openaiFileId,
                ])
                ->throw()
                ->json();

            $status = $this->normalizeOpenAiStatus($vectorFile['status'] ?? 'processing');

            $knowledgeFile->update([
                'openai_file_id' => $openaiFileId,
                'vector_store_file_id' => $vectorFile['id'] ?? $openaiFileId,
                'status' => $status,
                'error_message' => null,
                'metadata' => [
                    'source' => 'admin_upload',
                    'openai_file' => $uploadedFile,
                    'vector_store_file' => $vectorFile,
                ],
            ]);

            return $this->formatKnowledgeFile($knowledgeFile->fresh());
        } catch (Throwable $e) {
            $knowledgeFile->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw new RuntimeException('Không thể upload tài liệu lên OpenAI Vector Store: ' . $e->getMessage(), 500);
        }
    }

    public function toggleKnowledgeFile(int $id): array
    {
        $file = ChatKnowledgeFile::query()->find($id);

        if (!$file) {
            throw new RuntimeException('Không tìm thấy tài liệu tri thức', 404);
        }

        $file->update([
            'is_active' => !$file->is_active,
        ]);

        return $this->formatKnowledgeFile($file->fresh());
    }

    private function normalizeOpenAiStatus(?string $status): string
    {
        return match ($status) {
            'completed' => 'completed',
            'failed' => 'failed',
            'cancelled' => 'cancelled',
            'in_progress' => 'processing',
            'processing' => 'processing',
            default => 'processing',
        };
    }

    private function formatKnowledgeFile(ChatKnowledgeFile $file): array
    {
        return [
            'id' => $file->id,
            'title' => $file->title,
            'description' => $file->description,
            'original_name' => $file->original_name,
            'mime_type' => $file->mime_type,
            'size' => (int) $file->size,

            'openai_file_id' => $file->openai_file_id,
            'vector_store_id' => $file->vector_store_id,
            'vector_store_file_id' => $file->vector_store_file_id,

            'status' => $file->status,
            'error_message' => $file->error_message,
            'is_active' => (bool) $file->is_active,

            'uploaded_by' => $file->uploaded_by,

            'created_at' => optional($file->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($file->updated_at)->format('d/m/Y H:i'),
        ];
    }

    public function syncKnowledgeFileStatus(int $id): array
    {
        $file = ChatKnowledgeFile::query()->find($id);

        if (!$file) {
            throw new RuntimeException('Không tìm thấy tài liệu tri thức', 404);
        }

        if (!$file->vector_store_id || !$file->openai_file_id) {
            throw new RuntimeException('Tài liệu chưa có thông tin OpenAI File', 400);
        }

        $response = $this->retrieveOpenAiVectorStoreFile(
            $file->vector_store_id,
            $file->openai_file_id
        );

        $file->update([
            'status' => $this->normalizeOpenAiStatus($response['status'] ?? 'processing'),
            'error_message' => null,
            'metadata' => array_merge($file->metadata ?? [], [
                'last_status_check' => now()->toDateTimeString(),
                'vector_store_file_status' => $response,
            ]),
        ]);

        return $this->formatKnowledgeFile($file->fresh());
    }

    public function syncProcessingKnowledgeFiles(?int $limit = null): array
    {
        $limit = $limit ?: (int) config('services.n8n.ai_sync_limit', 20);
        $limit = max(1, min($limit, 100));

        $files = ChatKnowledgeFile::query()
            ->whereIn('status', ['pending', 'processing'])
            ->whereNotNull('openai_file_id')
            ->whereNotNull('vector_store_id')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        $result = [
            'total_candidates' => $files->count(),
            'synced_count' => 0,
            'completed_count' => 0,
            'processing_count' => 0,
            'failed_count' => 0,
            'cancelled_count' => 0,
            'error_count' => 0,
            'items' => [],
        ];

        foreach ($files as $file) {
            try {
                $synced = $this->syncKnowledgeFileStatus($file->id);

                $result['synced_count']++;

                if (($synced['status'] ?? null) === 'completed') {
                    $result['completed_count']++;
                } elseif (($synced['status'] ?? null) === 'failed') {
                    $result['failed_count']++;
                } elseif (($synced['status'] ?? null) === 'cancelled') {
                    $result['cancelled_count']++;
                } else {
                    $result['processing_count']++;
                }

                $result['items'][] = [
                    'id' => $synced['id'],
                    'title' => $synced['title'],
                    'openai_file_id' => $synced['openai_file_id'],
                    'status' => $synced['status'],
                    'error_message' => $synced['error_message'],
                ];
            } catch (Throwable $e) {
                $result['error_count']++;

                $result['items'][] = [
                    'id' => $file->id,
                    'title' => $file->title,
                    'openai_file_id' => $file->openai_file_id,
                    'status' => $file->status,
                    'error_message' => $e->getMessage(),
                ];

                $file->update([
                    'error_message' => $e->getMessage(),
                ]);
            }
        }

        return $result;
    }

    private function retrieveOpenAiVectorStoreFile(string $vectorStoreId, string $openaiFileId): array
    {
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        try {
            return Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(60)
                ->get($baseUrl . "/vector_stores/{$vectorStoreId}/files/{$openaiFileId}")
                ->throw()
                ->json();
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể kiểm tra trạng thái file trên OpenAI: ' . $e->getMessage(), 500);
        }
    }

    public function deleteKnowledgeFile(int $id): array
    {
        $file = ChatKnowledgeFile::query()->find($id);

        if (!$file) {
            throw new RuntimeException('Không tìm thấy tài liệu tri thức', 404);
        }

        $metadata = $file->metadata ?? [];

        $removeVectorResult = null;
        $deleteFileResult = null;

        if ($file->vector_store_id && $file->openai_file_id) {
            $removeVectorResult = $this->deleteOpenAiVectorStoreFile(
                $file->vector_store_id,
                $file->openai_file_id
            );
        }

        if ($file->openai_file_id) {
            $deleteFileResult = $this->deleteOpenAiFile($file->openai_file_id);
        }

        $file->update([
            'status' => 'cancelled',
            'is_active' => false,
            'error_message' => null,
            'metadata' => array_merge($metadata, [
                'deleted_at' => now()->toDateTimeString(),
                'delete_action' => [
                    'removed_from_vector_store' => $removeVectorResult,
                    'deleted_openai_file' => $deleteFileResult,
                ],
            ]),
        ]);

        return $this->formatKnowledgeFile($file->fresh());
    }

    private function deleteOpenAiVectorStoreFile(string $vectorStoreId, string $openaiFileId): array
    {
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        try {
            return Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(60)
                ->delete($baseUrl . "/vector_stores/{$vectorStoreId}/files/{$openaiFileId}")
                ->throw()
                ->json();
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể gỡ file khỏi OpenAI Vector Store: ' . $e->getMessage(), 500);
        }
    }

    private function deleteOpenAiFile(string $openaiFileId): array
    {
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        try {
            return Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(60)
                ->delete($baseUrl . "/files/{$openaiFileId}")
                ->throw()
                ->json();
        } catch (Throwable $e) {
            return [
                'deleted' => false,
                'warning' => $e->getMessage(),
            ];
        }
    }
}