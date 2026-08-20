<?php

namespace App\Services\Chat;

use App\Models\ChatConversation;
use App\Models\ChatMessage;

class ConversationMemoryService
{
    public function getState(ChatConversation $conversation): array
    {
        $conversation->refresh();
        $state = $conversation->context_state;

        if (is_array($state) && !empty($state)) {
            return $this->normalizeState($state);
        }

        $metadataState = data_get($conversation->metadata, 'context_state', []);

        return $this->normalizeState(is_array($metadataState) ? $metadataState : []);
    }

    public function updateFromAssistantMessage(ChatConversation $conversation, ChatMessage $assistantMessage): array
    {
        $state = $this->getState($conversation);
        $metadata = $assistantMessage->metadata ?? [];
        $intent = (string) data_get($metadata, 'intent', 'unknown');
        $products = data_get($metadata, 'products', []);
        $promotions = data_get($metadata, 'promotions', []);

        if (!empty($products)) {
            $state['topics']['product']['last_list'] = $this->buildEntityList('product', $products, $assistantMessage->id);
            $state['topics']['product']['last_message_id'] = $assistantMessage->id;
        }

        if (!empty($promotions)) {
            $state['topics']['promotion']['last_list'] = $this->buildEntityList('promotion', $promotions, $assistantMessage->id);
            $state['topics']['promotion']['last_message_id'] = $assistantMessage->id;
        } elseif ($intent === 'promotion_query' && !empty($products)) {
            $promotionEntities = collect($products)
                ->map(fn ($product) => $product['promotion'] ?? null)
                ->filter(fn ($promotion) => is_array($promotion) && !empty($promotion['id']))
                ->unique('id')
                ->values()
                ->toArray();

            if (!empty($promotionEntities)) {
                $state['topics']['promotion']['last_list'] = $this->buildEntityList('promotion', $promotionEntities, $assistantMessage->id);
                $state['topics']['promotion']['last_message_id'] = $assistantMessage->id;
            }
        }

        $state['meta']['last_updated_at'] = now()->toIso8601String();
        $state['meta']['last_assistant_message_id'] = $assistantMessage->id;

        $conversation->forceFill([
            'context_state' => $state,
            'metadata' => array_merge($conversation->metadata ?? [], [
                'context_state' => $state,
            ]),
        ])->save();

        return $state;
    }

    public function topicContext(ChatConversation $conversation, string $topic): array
    {
        return data_get($this->getState($conversation), 'topics.' . $topic, []);
    }

    private function buildEntityList(string $type, array $items, int $messageId): array
    {
        return collect($items)
            ->values()
            ->map(function (array $item, int $index) use ($type, $messageId) {
                return [
                    'type' => $type,
                    'position' => $index + 1,
                    'id' => $item['id'] ?? null,
                    'name' => $item['name'] ?? $item['title'] ?? null,
                    'slug' => $item['slug'] ?? null,
                    'source_message_id' => $messageId,
                    'attributes' => [
                        'discount_type' => $item['discount_type'] ?? data_get($item, 'promotion.discount_type'),
                        'discount_value' => $item['discount_value'] ?? data_get($item, 'promotion.discount_value'),
                        'url' => $item['url'] ?? data_get($item, 'promotion.url'),
                    ],
                ];
            })
            ->filter(fn ($item) => !empty($item['id']) || !empty($item['name']))
            ->values()
            ->toArray();
    }

    private function normalizeState(array $state): array
    {
        return [
            'topics' => $state['topics'] ?? [],
            'meta' => $state['meta'] ?? [],
        ];
    }
}
