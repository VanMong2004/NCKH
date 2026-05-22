<?php

namespace App\Services;

use App\Models\Blog;

class BlogService
{
    public function list(array $filters = [])
    {
        $query = Blog::query()
            ->where('is_published', true)
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at');

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['keyword'] . '%')
                    ->orWhere('excerpt', 'like', '%' . $filters['keyword'] . '%')
                    ->orWhere('content', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 10;

        $blogs = $query->paginate($perPage);

        $blogs->setCollection(
            $blogs->getCollection()
                ->map(fn ($blog) => $this->formatCard($blog))
        );

        return $blogs;
    }

    public function categories()
    {
        return Blog::query()
            ->where('is_published', true)
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');
    }

    public function featured()
    {
        $blog = Blog::query()
            ->where('is_published', true)
            ->where('is_featured', true)
            ->orderByDesc('published_at')
            ->first();

        return $blog ? $this->formatCard($blog) : null;
    }

    private function formatCard($blog)
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'excerpt' => $blog->excerpt,
            'thumbnail' => $blog->thumbnail,
            'category' => $blog->category,
            'author_name' => $blog->author_name,
            'is_featured' => (bool) $blog->is_featured,
            'view_count' => (int) $blog->view_count,
            'published_at' => optional($blog->published_at)->format('d/m/Y H:i'),
        ];
    }
}