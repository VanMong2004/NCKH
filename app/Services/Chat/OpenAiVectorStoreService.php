<?php

namespace App\Services\Chat;

use App\Models\ChatKnowledgeFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class OpenAiVectorStoreService
{
    public function listKnowledgeFiles(array $filters = [])
    {
        $vectorStoreId = config('services.openai.vector_store_id');

        if (!$vectorStoreId) {
            throw new RuntimeException('Chưa cấu hình OPENAI_VECTOR_STORE_ID', 500);
        }

        $remoteFiles = $this->listOpenAiVectorStoreFiles($vectorStoreId);
        $localFiles = ChatKnowledgeFile::query()
            ->get()
            ->keyBy(fn (ChatKnowledgeFile $file) => (string) ($file->openai_file_id ?: $file->vector_store_file_id ?: $file->id));

        $items = collect($remoteFiles)
            ->map(function (array $remoteFile) use ($localFiles, $vectorStoreId) {
                $openaiFileId = (string) ($remoteFile['file_id'] ?? '');
                $vectorStoreFileId = (string) ($remoteFile['id'] ?? '');
                $local = $localFiles->get($openaiFileId)
                    ?? $localFiles->get($vectorStoreFileId);

                return $this->formatKnowledgeFileFromSources($remoteFile, $vectorStoreId, $local);
            });

        $items = $items
            ->filter(function (array $item) use ($filters) {
                if (!empty($filters['status']) && ($item['status'] ?? null) !== $filters['status']) {
                    return false;
                }

                if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
                    if ((bool) ($item['is_active'] ?? false) !== (bool) $filters['is_active']) {
                        return false;
                    }
                }

                if (!empty($filters['keyword'])) {
                    $keyword = Str::lower(trim((string) $filters['keyword']));
                    $haystack = Str::lower(implode(' ', array_filter([
                        $item['title'] ?? '',
                        $item['original_name'] ?? '',
                        $item['description'] ?? '',
                        $item['openai_file_id'] ?? '',
                    ])));

                    if ($keyword !== '' && !str_contains($haystack, $keyword)) {
                        return false;
                    }
                }

                return true;
            })
            ->sortByDesc(fn (array $item) => strtotime($this->normalizeDateForSort($item['updated_at'] ?? $item['created_at'] ?? null)))
            ->values();

        return $items;
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

        $documentKey = $this->resolveDocumentKey($data, $file);

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
                'document_key' => $documentKey,
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
                    'document_key' => $documentKey,
                    'openai_file' => $uploadedFile,
                    'vector_store_file' => $vectorFile,
                ],
            ]);

            $this->retirePreviousDocumentVersions($documentKey, $knowledgeFile->id);

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

    private function resolveDocumentKey(array $data, UploadedFile $file): string
    {
        $rawKey = trim((string) ($data['document_key'] ?? ''));

        if ($rawKey === '') {
            $rawKey = $data['title']
                ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        }

        $key = Str::slug($rawKey);

        return $key !== '' ? $key : 'document-' . md5($file->getClientOriginalName());
    }

    private function retirePreviousDocumentVersions(string $documentKey, int $currentFileId): void
    {
        ChatKnowledgeFile::query()
            ->where('id', '!=', $currentFileId)
            ->where('is_active', true)
            ->where('metadata->document_key', $documentKey)
            ->orderBy('id')
            ->get()
            ->each(function (ChatKnowledgeFile $file) {
                try {
                    $this->deleteKnowledgeFile($file->id);
                } catch (Throwable $e) {
                    $file->update([
                        'error_message' => 'Không thể gỡ phiên bản cũ: ' . $e->getMessage(),
                    ]);
                }
            });
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
            'document_key' => data_get($file->metadata, 'document_key'),

            'created_at' => optional($file->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($file->updated_at)->format('d/m/Y H:i'),
            'manageable' => true,
        ];
    }

    private function formatKnowledgeFileFromSources(array $remoteFile, string $vectorStoreId, ?ChatKnowledgeFile $localFile = null): array
    {
        $openAiFile = $remoteFile['openai_file'] ?? [];
        $openaiFileId = $remoteFile['file_id'] ?? $remoteFile['id'] ?? data_get($openAiFile, 'id');
        $filename = data_get($openAiFile, 'filename')
            ?: data_get($remoteFile, 'filename')
            ?: ($localFile?->original_name ?: 'Tài liệu AI');
        $localTitle = trim((string) ($localFile?->title ?? ''));
        $normalizedLocalTitle = Str::of($localTitle)->lower()->ascii()->value();
        $fallbackTitle = pathinfo($filename, PATHINFO_FILENAME);
        $title = $localTitle !== '' && !in_array($normalizedLocalTitle, ['tai lieu ai', 'tai lieu tri thuc'], true)
            ? $localTitle
            : $fallbackTitle;
        $createdAt = $this->formatUnixTimestamp(data_get($openAiFile, 'created_at'))
            ?: optional($localFile?->created_at)->format('d/m/Y H:i');
        $updatedAt = optional($localFile?->updated_at)->format('d/m/Y H:i') ?: $createdAt;

        return [
            'id' => $localFile?->id ?: 'remote:' . ($remoteFile['id'] ?? $openaiFileId ?? Str::uuid()->toString()),
            'title' => $title,
            'description' => $localFile?->description,
            'original_name' => $filename,
            'mime_type' => data_get($openAiFile, 'mime_type', $localFile?->mime_type),
            'size' => (int) (data_get($openAiFile, 'bytes') ?? $localFile?->size ?? 0),
            'openai_file_id' => $openaiFileId,
            'vector_store_id' => $localFile?->vector_store_id ?: $vectorStoreId,
            'vector_store_file_id' => $localFile?->vector_store_file_id ?: ($remoteFile['id'] ?? $openaiFileId),
            'status' => $localFile?->status ?: $this->normalizeOpenAiStatus($remoteFile['status'] ?? 'processing'),
            'error_message' => $localFile?->error_message,
            'is_active' => $localFile?->is_active ?? true,
            'uploaded_by' => $localFile?->uploaded_by,
            'document_key' => data_get($localFile?->metadata, 'document_key'),
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
            'manageable' => (bool) $localFile,
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
            $file->vector_store_file_id ?: $file->openai_file_id
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

    private function listOpenAiVectorStoreFiles(string $vectorStoreId): array
    {
        $apiKey = config('services.openai.api_key');
        $baseUrl = rtrim(config('services.openai.base_url'), '/');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(60)
                ->get($baseUrl . "/vector_stores/{$vectorStoreId}/files")
                ->throw()
                ->json();
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể tải danh sách tài liệu từ OpenAI Vector Store: ' . $e->getMessage(), 500);
        }

        $items = collect($response['data'] ?? [])
            ->map(function (array $item) use ($baseUrl, $apiKey) {
                $openAiFile = null;
                $fileId = $item['file_id'] ?? $item['id'] ?? null;

                if ($fileId) {
                    try {
                        $openAiFile = Http::withToken($apiKey)
                            ->acceptJson()
                            ->timeout(30)
                            ->get($baseUrl . "/files/{$fileId}")
                            ->throw()
                            ->json();
                    } catch (Throwable) {
                        $openAiFile = null;
                    }
                }

                $item['openai_file'] = $openAiFile;

                return $item;
            })
            ->filter(function (array $item) {
                $openAiFile = $item['openai_file'] ?? [];

                return !empty($openAiFile['id']) && !empty($openAiFile['filename']);
            })
            ->values()
            ->toArray();

        return $items;
    }

    private function formatUnixTimestamp($timestamp): ?string
    {
        if (!is_numeric($timestamp)) {
            return null;
        }

        return now()->setTimestamp((int) $timestamp)->format('d/m/Y H:i');
    }

    private function normalizeDateForSort(?string $value): string
    {
        if (!$value) {
            return '1970-01-01 00:00:00';
        }

        try {
            return \Carbon\Carbon::createFromFormat('d/m/Y H:i', $value)->format('Y-m-d H:i:s');
        } catch (Throwable) {
            return '1970-01-01 00:00:00';
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
                $file->vector_store_file_id ?: $file->openai_file_id
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
