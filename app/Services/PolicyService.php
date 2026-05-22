<?php

namespace App\Services;

use App\Models\Policy;

class PolicyService
{
    public function list(array $filters = [])
    {
        $query = Policy::query()
            ->where('is_active', true)
            ->orderBy('sort_order');

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query->get()
            ->map(fn ($policy) => $this->formatCard($policy))
            ->values();
    }

    public function show($slug)
    {
        $policy = Policy::query()
            ->where('is_active', true)
            ->where('slug', $slug)
            ->firstOrFail();

        return $this->formatDetail($policy);
    }

    private function formatCard($policy)
    {
        return [
            'id' => $policy->id,
            'title' => $policy->title,
            'slug' => $policy->slug,
            'type' => $policy->type,
        ];
    }

    private function formatDetail($policy)
    {
        return [
            'id' => $policy->id,
            'title' => $policy->title,
            'slug' => $policy->slug,
            'type' => $policy->type,
            'content' => $policy->content,
        ];
    }
}