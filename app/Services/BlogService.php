<?php

namespace App\Services;

use App\Models\Blog;
use RuntimeException;

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
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('excerpt', 'like', '%' . $keyword . '%')
                    ->orWhere('content', 'like', '%' . $keyword . '%');
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

    public function show($identifier)
    {
        $blog = Blog::query()
            ->where('is_published', true)
            ->when(
                is_numeric($identifier),
                fn ($q) => $q->where('id', $identifier),
                fn ($q) => $q->where('slug', $identifier)
            )
            ->first();

        if (!$blog) {
            throw new RuntimeException('Blog không tồn tại');
        }

        $blog->increment('view_count');

        $related = Blog::query()
            ->where('id', '!=', $blog->id)
            ->where('category', $blog->category)
            ->where('is_published', true)
            ->limit(4)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'thumbnail' => $item->thumbnail,
            ]);

        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'excerpt' => $blog->excerpt,
            'content' => $blog->content,
            'thumbnail' => $blog->thumbnail,
            'category' => $blog->category,
            'author_name' => $blog->author_name,
            'view_count' => (int) ($blog->view_count + 1),
            'published_at' => optional($blog->published_at)->format('d/m/Y H:i'),
            'related_posts' => $related,
        ];
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