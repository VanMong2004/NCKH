<?php

namespace App\Services\Chat;

use App\Models\ChatbotApprovedAnswer;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use RuntimeException;

class ChatbotApprovedAnswerService
{
    public function __construct(
        protected ChatbotQuestionNormalizer $normalizer,
        protected ChatbotEmbeddingService $embeddingService,
        protected ChatbotAnswerConfidenceService $confidenceService
    ) {}

    public function findBestMatch(string $question, ?string $intent = null): ?array
    {
        $normalized = $this->normalizer->normalize($question);

        if ($normalized === '') {
            return null;
        }

        $baseQuery = ChatbotApprovedAnswer::query()
            ->where('status', 'approved')
            ->where('is_active', true)
            ->where(function ($query) {
                $now = now();
                $query->whereNull('effective_from')->orWhere('effective_from', '<=', $now);
            })
            ->where(function ($query) {
                $now = now();
                $query->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            });

        if ($intent !== null && $intent !== '' && $intent !== 'rag') {
            $baseQuery->whereIn('intent', [$intent, 'static_knowledge']);
        }

        $exact = (clone $baseQuery)
            ->where('question_hash', $this->normalizer->hash($question))
            ->first();

        if ($exact) {
            return $this->markUsed($exact, 'exact', 1.0, 1.0, null);
        }

        $candidates = (clone $baseQuery)
            ->latest('approved_at')
            ->limit(100)
            ->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        $lexical = $this->findBestLexicalMatch($candidates, $normalized);
        if ($lexical && $this->confidenceService->passes($lexical['confidence'])) {
            return $this->markUsed(
                $lexical['answer'],
                'lexical',
                $lexical['confidence'],
                $lexical['lexical_score'],
                null
            );
        }

        $semantic = $this->findBestSemanticMatch($candidates, $question, $normalized);
        if ($semantic && $this->confidenceService->passes($semantic['confidence'])) {
            return $this->markUsed(
                $semantic['answer'],
                'semantic',
                $semantic['confidence'],
                $semantic['lexical_score'],
                $semantic['semantic_score']
            );
        }

        return null;
    }

    public function preparePayload(array $data, $approver = null, ?ChatbotApprovedAnswer $existing = null): array
    {
        $question = trim((string) ($data['question'] ?? $existing?->question ?? ''));
        $answer = trim((string) ($data['answer'] ?? $existing?->answer ?? ''));

        if ($question === '' || $answer === '') {
            throw new RuntimeException('Câu hỏi và câu trả lời không được để trống', 422);
        }

        $normalizedQuestion = $this->normalizer->normalize($question);
        $questionHash = sha1($normalizedQuestion);
        $embedding = $existing?->question_embedding;

        if ($existing === null || $existing->normalized_question !== $normalizedQuestion) {
            try {
                $embedding = $this->embeddingService->embed($question);
            } catch (RuntimeException) {
                $embedding = $existing?->question_embedding;
            }
        }

        $status = (string) ($data['status'] ?? $existing?->status ?? 'draft');
        $approvedAt = $existing?->approved_at;
        $approvedBy = $existing?->approved_by;

        if ($status === 'approved') {
            $approvedAt = $approvedAt ?: now();
            $approvedBy = $approver?->id ?: $approvedBy;
        } else {
            $approvedAt = null;
            $approvedBy = null;
        }

        return [
            'question' => $question,
            'normalized_question' => $normalizedQuestion,
            'question_hash' => $questionHash,
            'question_embedding' => $embedding,
            'answer' => $answer,
            'intent' => trim((string) ($data['intent'] ?? $existing?->intent ?? 'static_knowledge')) ?: 'static_knowledge',
            'intent_signature' => trim((string) ($data['intent_signature'] ?? $existing?->intent_signature ?? '')) ?: null,
            'entities_json' => $data['entities_json'] ?? $existing?->entities_json,
            'status' => in_array($status, ['draft', 'approved'], true) ? $status : 'draft',
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : (bool) ($existing?->is_active ?? true),
            'approved_by' => $approvedBy,
            'approved_at' => $approvedAt,
            'effective_from' => $this->parseNullableDate($data['effective_from'] ?? $existing?->effective_from),
            'effective_to' => $this->parseNullableDate($data['effective_to'] ?? $existing?->effective_to),
            'source_type' => trim((string) ($data['source_type'] ?? $existing?->source_type ?? '')) ?: null,
            'source_reference' => trim((string) ($data['source_reference'] ?? $existing?->source_reference ?? '')) ?: null,
        ];
    }

    private function findBestLexicalMatch(Collection $candidates, string $normalizedQuestion): ?array
    {
        return $candidates
            ->map(function (ChatbotApprovedAnswer $answer) use ($normalizedQuestion) {
                $target = (string) $answer->normalized_question;
                $lexical = $this->lexicalSimilarity($normalizedQuestion, $target);
                $confidence = $this->confidenceService->score('lexical', $lexical, 0.0);

                return [
                    'answer' => $answer,
                    'lexical_score' => $lexical,
                    'confidence' => $confidence,
                ];
            })
            ->sortByDesc('confidence')
            ->first();
    }

    private function findBestSemanticMatch(Collection $candidates, string $question, string $normalizedQuestion): ?array
    {
        $questionEmbedding = $this->embeddingService->embed($question);

        if ($questionEmbedding === null) {
            return null;
        }

        return $candidates
            ->filter(fn (ChatbotApprovedAnswer $answer) => is_array($answer->question_embedding) && !empty($answer->question_embedding))
            ->map(function (ChatbotApprovedAnswer $answer) use ($questionEmbedding, $normalizedQuestion) {
                $lexical = $this->lexicalSimilarity($normalizedQuestion, (string) $answer->normalized_question);
                $semantic = $this->embeddingService->cosineSimilarity($questionEmbedding, $answer->question_embedding);
                $confidence = $this->confidenceService->score('semantic', $lexical, $semantic);

                return [
                    'answer' => $answer,
                    'lexical_score' => $lexical,
                    'semantic_score' => $semantic,
                    'confidence' => $confidence,
                ];
            })
            ->sortByDesc('confidence')
            ->first();
    }

    private function lexicalSimilarity(string $left, string $right): float
    {
        if ($left === '' || $right === '') {
            return 0.0;
        }

        if ($left === $right) {
            return 1.0;
        }

        similar_text($left, $right, $percent);
        $similarity = $percent / 100;

        $leftTokens = array_values(array_filter(explode(' ', $left)));
        $rightTokens = array_values(array_filter(explode(' ', $right)));
        $intersection = count(array_intersect($leftTokens, $rightTokens));
        $union = count(array_unique(array_merge($leftTokens, $rightTokens)));
        $jaccard = $union > 0 ? $intersection / $union : 0.0;

        return max(0.0, min(1.0, ($similarity * 0.6) + ($jaccard * 0.4)));
    }

    private function markUsed(
        ChatbotApprovedAnswer $answer,
        string $matchType,
        float $confidence,
        ?float $lexicalScore,
        ?float $semanticScore
    ): array {
        $answer->forceFill([
            'use_count' => (int) $answer->use_count + 1,
            'last_used_at' => now(),
        ])->save();

        return [
            'id' => $answer->id,
            'question' => $answer->question,
            'answer' => $answer->answer,
            'intent' => $answer->intent,
            'match_type' => $matchType,
            'confidence' => $confidence,
            'lexical_score' => $lexicalScore,
            'semantic_score' => $semanticScore,
            'source_type' => $answer->source_type,
            'source_reference' => $answer->source_reference,
        ];
    }

    private function parseNullableDate(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value;
        }

        return Carbon::parse($value);
    }
}
