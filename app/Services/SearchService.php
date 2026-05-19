<?php

namespace App\Services;

use App\Models\Product;
use App\Models\SearchHistory;

class SearchService
{
    public function suggestions($user, string $keyword)
    {
        // lưu history nếu đã login
        if ($user && strlen(trim($keyword)) >= 2) {

            SearchHistory::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'keyword' => trim($keyword)
                ],
                []
            );
        }

        return Product::query()
            ->with('images')
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

                    'average_rating' =>
                    (float)$product->average_rating,
                ];
            });
    }

    public function history($user)
    {
        return SearchHistory::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();
    }

    public function deleteHistory($user, $id)
    {
        SearchHistory::query()
            ->where(
                'user_id',
                $user->id
            )
            ->findOrFail($id)
            ->delete();

        return true;
    }

    public function clearHistory($user)
    {
        SearchHistory::query()
            ->where(
                'user_id',
                $user->id
            )
            ->delete();

        return true;
    }
}