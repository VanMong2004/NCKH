<?php

namespace App\Services;

use App\Models\Blog;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class BlogService
{
    private ?bool $hasSummaryColumn = null;
    private ?bool $hasStatusColumn = null;
    private ?bool $hasAuthorIdColumn = null;

    public function list(array $filters = [])
    {
        $query = Blog::query();

        $this->applyPublishedConstraint($query);

        $query->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('is_featured')
            ->orderByDesc('published_at');

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', '%' . $keyword . '%')
                    ->orWhere($this->summaryColumn(), 'like', '%' . $keyword . '%')
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
        $query = Blog::query();

        if ($this->hasAuthorIdColumn()) {
            $query->with('author:id,name');
        }

        $this->applyPublishedConstraint($query);

        $blog = $query
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

        $latestPostsQuery = Blog::query()
            ->where('id', '!=', $blog->id)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());

        $this->applyPublishedConstraint($latestPostsQuery);

        $latestPosts = $latestPostsQuery
            ->orderByDesc('published_at')
            ->limit(4)
            ->get()
            ->map(fn ($item) => $this->formatCard($item));

        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $this->resolveSummary($blog),
            'content' => $blog->content,
            'thumbnail' => $blog->thumbnail,
            'published_at' => optional($blog->published_at)->toIso8601String(),
            'author_name' => $this->resolveAuthorName($blog),
            'latest_posts' => $latestPosts,
        ];
    }

    public function featured()
    {
        $query = Blog::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where('is_featured', true)
            ->orderByDesc('published_at');

        $this->applyPublishedConstraint($query);

        $blogs = $query->limit(5)->get();

        return $blogs->map(fn ($blog) => $this->formatCard($blog))->values()->all();
    }

    private function formatCard(Blog $blog): array
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $this->resolveSummary($blog),
            'thumbnail' => $blog->thumbnail,
            'is_featured' => (bool) $blog->is_featured,
            'published_at' => optional($blog->published_at)->toIso8601String(),
        ];
    }

    private function applyPublishedConstraint($query): void
    {
        if ($this->hasStatusColumn()) {
            $query->where('status', 'published');
            return;
        }

        $query->where('is_published', true);
    }

    private function resolveSummary(Blog $blog): ?string
    {
        if ($this->hasSummaryColumn()) {
            return $blog->summary;
        }

        return $blog->excerpt;
    }

    private function summaryColumn(): string
    {
        return $this->hasSummaryColumn() ? 'summary' : 'excerpt';
    }

    private function hasSummaryColumn(): bool
    {
        if ($this->hasSummaryColumn === null) {
            $this->hasSummaryColumn = Schema::hasColumn('blogs', 'summary');
        }

        return $this->hasSummaryColumn;
    }

    private function hasStatusColumn(): bool
    {
        if ($this->hasStatusColumn === null) {
            $this->hasStatusColumn = Schema::hasColumn('blogs', 'status');
        }

        return $this->hasStatusColumn;
    }

    private function hasAuthorIdColumn(): bool
    {
        if ($this->hasAuthorIdColumn === null) {
            $this->hasAuthorIdColumn = Schema::hasColumn('blogs', 'author_id');
        }

        return $this->hasAuthorIdColumn;
    }

    private function resolveAuthorName(Blog $blog): string
    {
        if ($this->hasAuthorIdColumn()) {
            return $blog->author?->full_name
                ?? $blog->author?->name
                ?? 'Ban quan tri CTUT UniShop';
        }

        return $blog->author_name ?: 'Ban quan tri CTUT UniShop';
    }
}
