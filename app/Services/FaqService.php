<?php

namespace App\Services;

use App\Models\Faq;

class FaqService
{
    public function list(array $filters = [])
    {
        $query = Faq::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->latest();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('question', 'like', '%' . $filters['keyword'] . '%')
                  ->orWhere('answer', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        return $query->get()->map(fn ($faq) => $this->format($faq));
    }

    public function categories()
    {
        return Faq::query()
            ->where('is_active', true)
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');
    }

    private function format($faq)
    {
        return [
            'id' => $faq->id,
            'category' => $faq->category,
            'question' => $faq->question,
            'answer' => $faq->answer,
        ];
    }
}