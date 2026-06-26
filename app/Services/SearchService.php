<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SearchHistory;
use RuntimeException;

class SearchService
{
    public function suggestions($user, string $keyword)
    {
        $keyword = trim($keyword);

        if (mb_strlen($keyword) < 2) {
            return collect();
        }

        if ($user) {
            SearchHistory::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'keyword' => $keyword,
                ],
                []
            );
        }

        $words = collect(preg_split('/\s+/', $keyword))
            ->map(fn ($word) => trim($word))
            ->filter(fn ($word) => mb_strlen($word) >= 1)
            ->unique()
            ->values();

        return Product::query()
            ->with('images')
            ->where('is_active', true)
            ->where(function ($query) use ($keyword, $words) {
                $query->where('name', 'like', '%' . $keyword . '%');

                foreach ($words as $word) {
                    $query->orWhere('name', 'like', '%' . $word . '%');
                }
            })
            ->orderByRaw(
                "CASE 
                    WHEN name LIKE ? THEN 1
                    ELSE 2
                END",
                ['%' . $keyword . '%']
            )
            ->latest()
            ->limit(8)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,

                    'thumbnail' =>
                        optional(
                            $product->images
                                ?->where('type', 'thumbnail')
                                ->first()
                        )->url
                        ??
                        optional(
                            $product->images?->first()
                        )->url,

                    'average_rating' => (float) $product->average_rating,
                ];
            });
    }

    public function history($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        return SearchHistory::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();
    }

    public function deleteHistory($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $history = SearchHistory::query()
            ->where('user_id', $user->id)
            ->find($id);

        if (!$history) {
            throw new RuntimeException('Lịch sử tìm kiếm không tồn tại', 404);
        }

        $history->delete();

        return true;
    }

    public function clearHistory($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        SearchHistory::query()
            ->where('user_id', $user->id)
            ->delete();

        return true;
    }
}