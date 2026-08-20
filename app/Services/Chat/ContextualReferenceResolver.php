<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class ContextualReferenceResolver
{
    public function __construct(
        protected ConversationMemoryService $memoryService
    ) {}

    public function resolve(ChatConversation $conversation, string $message): array
    {
        $normalized = $this->normalize($message);
        $state = $this->memoryService->getState($conversation);
        $hasReferenceSignal = $this->hasReferenceSignal($normalized);

        if (!$hasReferenceSignal) {
            return [
                'matched' => false,
                'has_reference_signal' => false,
                'normalized_message' => $normalized,
            ];
        }

        $promotionOrdinal = $this->extractOrdinal($normalized);
        $hasPromotionSignal = $this->hasPromotionTopicSignal($normalized);

        $promotionMatch = $this->resolveTopicReference($normalized, data_get($state, 'topics.promotion.last_list', []), 'promotion');
        if ($promotionMatch['matched'] ?? false) {
            return [
                ...$promotionMatch,
                'has_reference_signal' => true,
                'normalized_message' => $normalized,
                'source' => 'conversation_memory',
            ];
        }

        if ($hasPromotionSignal && $promotionOrdinal !== null) {
            return [
                'matched' => false,
                'has_reference_signal' => true,
                'normalized_message' => $normalized,
                'ambiguous' => true,
            ];
        }

        $productMatch = $this->resolveTopicReference($normalized, data_get($state, 'topics.product.last_list', []), 'product');
        if ($productMatch['matched'] ?? false) {
            return [
                ...$productMatch,
                'has_reference_signal' => true,
                'normalized_message' => $normalized,
                'source' => 'conversation_memory',
            ];
        }

        if ($this->extractOrdinal($normalized) !== null) {
            return [
                'matched' => false,
                'has_reference_signal' => true,
                'normalized_message' => $normalized,
                'ambiguous' => true,
            ];
        }

        $gptFallback = $this->resolveWithGptFallback($normalized, $state);
        if ($gptFallback !== null) {
            return [
                ...$gptFallback,
                'has_reference_signal' => true,
                'normalized_message' => $normalized,
                'source' => 'gpt_context_fallback',
            ];
        }

        return [
            'matched' => false,
            'has_reference_signal' => true,
            'normalized_message' => $normalized,
            'ambiguous' => true,
        ];
    }

    private function resolveTopicReference(string $normalizedMessage, array $entities, string $type): array
    {
        if (empty($entities)) {
            return ['matched' => false];
        }

        $ordinal = $this->extractOrdinal($normalizedMessage);

        if ($ordinal !== null) {
            foreach ($entities as $entity) {
                if ((int) ($entity['position'] ?? 0) === $ordinal) {
                    return [
                        'matched' => true,
                        'entity_type' => $type,
                        'entity_id' => $entity['id'] ?? null,
                        'entity_name' => $entity['name'] ?? null,
                        'entity' => $entity,
                        'reference_type' => 'ordinal',
                        'confidence' => 1.0,
                    ];
                }
            }

            return [
                'matched' => false,
                'reference_type' => 'ordinal_not_found',
                'confidence' => 0.0,
            ];
        }

        $matchingByName = collect($entities)->first(function (array $entity) use ($normalizedMessage) {
            $name = $this->normalize((string) ($entity['name'] ?? ''));

            return $name !== '' && str_contains($normalizedMessage, $name);
        });

        if ($matchingByName) {
            return [
                'matched' => true,
                'entity_type' => $type,
                'entity_id' => $matchingByName['id'] ?? null,
                'entity_name' => $matchingByName['name'] ?? null,
                'entity' => $matchingByName,
                'reference_type' => 'name',
                'confidence' => 0.98,
            ];
        }

        $matchingByDiscount = collect($entities)->first(function (array $entity) use ($normalizedMessage) {
            $discountValue = data_get($entity, 'attributes.discount_value');
            if ($discountValue === null) {
                return false;
            }

            $discountText = $this->normalize((string) $discountValue);

            return $discountText !== '' && str_contains($normalizedMessage, $discountText);
        });

        if ($matchingByDiscount) {
            return [
                'matched' => true,
                'entity_type' => $type,
                'entity_id' => $matchingByDiscount['id'] ?? null,
                'entity_name' => $matchingByDiscount['name'] ?? null,
                'entity' => $matchingByDiscount,
                'reference_type' => 'structured_match',
                'confidence' => 0.9,
            ];
        }

        if (count($entities) === 1 && $this->containsAny($normalizedMessage, ['do', 'nay', 'kia', 'tren', 'luc nay', 'luc nay'])) {
            $entity = $entities[0];

            return [
                'matched' => true,
                'entity_type' => $type,
                'entity_id' => $entity['id'] ?? null,
                'entity_name' => $entity['name'] ?? null,
                'entity' => $entity,
                'reference_type' => 'single_candidate',
                'confidence' => 0.86,
            ];
        }

        return ['matched' => false];
    }

    private function resolveWithGptFallback(string $normalizedMessage, array $state): ?array
    {
        if (!config('services.openai.context_resolver_enabled', true)) {
            return null;
        }

        $candidates = collect(data_get($state, 'topics', []))
            ->flatMap(fn ($topic) => $topic['last_list'] ?? [])
            ->values()
            ->toArray();

        if (empty($candidates)) {
            return null;
        }

        $apiKey = config('services.openai.api_key');
        if (!$apiKey) {
            return null;
        }

        $baseUrl = rtrim((string) config('services.openai.base_url'), '/');

        try {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(20)
                ->post($baseUrl . '/responses', [
                    'model' => config('services.openai.chat_model'),
                    'instructions' => 'Resolve the referenced entity from the provided candidate list. Return only valid JSON with keys: entity_type, entity_id, entity_name, confidence. If unsure, return {"entity_id":null}.',
                    'input' => [[
                        'role' => 'user',
                        'content' => json_encode([
                            'message' => $normalizedMessage,
                            'candidates' => $candidates,
                        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ]],
                    'max_output_tokens' => 180,
                ])
                ->throw()
                ->json();
        } catch (Throwable) {
            return null;
        }

        $answer = trim((string) ($response['output_text'] ?? ''));
        if ($answer === '' || !preg_match('/\{.*\}/s', $answer, $matches)) {
            return null;
        }

        $payload = json_decode($matches[0], true);
        if (!is_array($payload) || empty($payload['entity_id'])) {
            return null;
        }

        $matched = collect($candidates)->first(fn ($candidate) => (int) ($candidate['id'] ?? 0) === (int) $payload['entity_id']);
        if (!$matched) {
            return null;
        }

        return [
            'matched' => true,
            'entity_type' => $payload['entity_type'] ?? $matched['type'] ?? null,
            'entity_id' => $matched['id'] ?? null,
            'entity_name' => $matched['name'] ?? null,
            'entity' => $matched,
            'reference_type' => 'gpt_context_fallback',
            'confidence' => max(0.0, min(1.0, (float) ($payload['confidence'] ?? 0.75))),
        ];
    }

    private function hasReferenceSignal(string $normalizedMessage): bool
    {
        return $this->containsAny($normalizedMessage, [
            'dot',
            'cai',
            'thu',
            'so',
            'do',
            'nay',
            'kia',
            'tren',
            'tiep theo',
            'luc nay',
            'cai do',
            'san pham do',
            'dot do',
            'chuong trinh do',
            'con cai nao',
            'con san pham nao',
        ]) || $this->extractOrdinal($normalizedMessage) !== null;
    }

    private function hasPromotionTopicSignal(string $normalizedMessage): bool
    {
        return $this->containsAny($normalizedMessage, [
            'khuyen mai',
            'chuong trinh',
            'dot',
        ]);
    }

    private function extractOrdinal(string $normalizedMessage): ?int
    {
        if (preg_match('/(?:dot|chuong trinh|khuyen mai|san pham|sp|cai|thu)\s*(?:so\s*)?(\d{1,2})/u', $normalizedMessage, $matches)) {
            return max(1, (int) $matches[1]);
        }

        if (preg_match('/(?:so|thu)\s*(\d{1,2})/u', $normalizedMessage, $matches)) {
            return max(1, (int) $matches[1]);
        }

        return null;
    }

    private function containsAny(string $text, array $needles): bool
    {
        foreach ($needles as $needle) {
            if ($needle !== '' && str_contains($text, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $value): string
    {
        $value = Str::ascii(mb_strtolower(trim($value)));
        $value = preg_replace('/[^\pL\pN\s]/u', ' ', $value);
        $value = preg_replace('/\s+/', ' ', (string) $value);

        return trim((string) $value);
    }
}
