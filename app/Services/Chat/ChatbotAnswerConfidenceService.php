<?php

namespace App\Services\Chat;

class ChatbotAnswerConfidenceService
{
    public function score(string $matchType, float $lexicalScore = 0.0, float $semanticScore = 0.0): float
    {
        return match ($matchType) {
            'exact' => 1.0,
            'semantic' => max(0.0, min(1.0, ($semanticScore * 0.7) + ($lexicalScore * 0.3))),
            'lexical' => max(0.0, min(1.0, $lexicalScore * 0.85)),
            default => max(0.0, min(1.0, ($lexicalScore + $semanticScore) / 2)),
        };
    }

    public function threshold(): float
    {
        return (float) config('services.openai.approved_answer_threshold', 0.82);
    }

    public function passes(float $score): bool
    {
        return $score >= $this->threshold();
    }
}
