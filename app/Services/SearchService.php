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

        if ($user && strlen($keyword) >= 2) {
            SearchHistory::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'keyword' => $keyword,
                ],
                []
            );
        }

        return Product::query()
            ->with('images')
            ->where('is_active', true)
            ->where(
                'name',
                'like',
                '%' . $keyword . '%'
            )
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
                                ?->where(
                                    'type',
                                    'thumbnail'
                                )
                                ->first()
                        )->url
                        ??
                        optional(
                            $product->images
                                ?->first()
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