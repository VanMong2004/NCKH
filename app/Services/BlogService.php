<?php

namespace App\Services;

use App\Models\Blog;
use RuntimeException;

class BlogService
{
    public function list(array $filters = [])
    {
        $query = Blog::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at');

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere('summary', 'like', '%' . $keyword . '%')
                    ->orWhere('content', 'like', '%' . $keyword . '%');
            });
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 50);
        $blogs = $query->paginate($perPage);

        $blogs->setCollection(
            $blogs->getCollection()->map(fn ($blog) => $this->formatCard($blog))
        );

        return $blogs;
    }

    public function show($identifier): array
    {
        $blog = Blog::query()
            ->with('author:id,name,full_name')
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->when(
                is_numeric($identifier),
                fn ($q) => $q->where('id', $identifier),
                fn ($q) => $q->where('slug', $identifier)
            )
            ->first();

        if (!$blog) {
            throw new RuntimeException('Bai viet khong ton tai');
        }

        $latestPosts = Blog::query()
            ->where('id', '!=', $blog->id)
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('published_at')
            ->limit(4)
            ->get()
            ->map(fn ($item) => $this->formatCard($item));

        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $blog->summary,
            'content' => $blog->content,
            'thumbnail' => $blog->thumbnail,
            'published_at' => optional($blog->published_at)->toIso8601String(),
            'author_name' => $blog->author?->full_name
                ?? $blog->author?->name
                ?? 'Ban quan tri CTUT UniShop',
            'latest_posts' => $latestPosts,
        ];
    }

    public function featured()
    {
        $blog = Blog::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where('is_featured', true)
            ->orderByDesc('published_at')
            ->first();

        return $blog ? $this->formatCard($blog) : null;
    }

    private function formatCard(Blog $blog): array
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $blog->summary,
            'thumbnail' => $blog->thumbnail,
            'is_featured' => (bool) $blog->is_featured,
            'published_at' => optional($blog->published_at)->toIso8601String(),
        ];
    }
}
