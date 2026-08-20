<?php

namespace App\Services\Chat;

use Illuminate\Support\Str;

class ChatbotQuestionNormalizer
{
    public function normalize(string $question): string
    {
        $value = trim($question);
        $value = Str::ascii(mb_strtolower($value));
        $value = preg_replace('/[^\pL\pN\s]/u', ' ', $value);
        $value = preg_replace('/\s+/', ' ', (string) $value);

        return trim((string) $value);
    }

    public function hash(string $question): string
    {
        return sha1($this->normalize($question));
    }
}
