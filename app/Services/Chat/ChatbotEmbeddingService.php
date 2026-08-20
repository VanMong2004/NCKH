<?php

namespace App\Services\Chat;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ChatbotEmbeddingService
{
    public function embed(string $input): ?array
    {
        $input = trim($input);

        if ($input === '') {
            return null;
        }

        $apiKey = config('services.openai.api_key');
        $model = trim((string) config('services.openai.embedding_model', 'text-embedding-3-small'));

        if ($apiKey === null || $apiKey === '' || $model === '') {
            return null;
        }

        $baseUrl = rtrim((string) config('services.openai.base_url'), '/');

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(30)
                ->post($baseUrl . '/embeddings', [
                    'model' => $model,
                    'input' => $input,
                ])
                ->throw()
                ->json();
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể tạo embedding cho chatbot: ' . $e->getMessage(), 500);
        }

        $vector = data_get($response, 'data.0.embedding');

        return is_array($vector) ? $vector : null;
    }

    public function cosineSimilarity(?array $left, ?array $right): float
    {
        if (empty($left) || empty($right) || count($left) !== count($right)) {
            return 0.0;
        }

        $dot = 0.0;
        $leftNorm = 0.0;
        $rightNorm = 0.0;

        foreach ($left as $index => $value) {
            $l = (float) $value;
            $r = (float) ($right[$index] ?? 0);
            $dot += $l * $r;
            $leftNorm += $l * $l;
            $rightNorm += $r * $r;
        }

        if ($leftNorm <= 0 || $rightNorm <= 0) {
            return 0.0;
        }

        return $dot / (sqrt($leftNorm) * sqrt($rightNorm));
    }
}
