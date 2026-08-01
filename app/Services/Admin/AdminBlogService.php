<?php

namespace App\Services\Admin;

use App\Models\Blog;
use Illuminate\Support\Str;
use RuntimeException;

class AdminBlogService
{
    public function index(array $filters = []): array
    {
        $query = Blog::query()->with('author:id,name,full_name');

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere('summary', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('is_featured', $filters) && $filters['is_featured'] !== null && $filters['is_featured'] !== '') {
            $query->where('is_featured', (bool) $filters['is_featured']);
        }

        $sort = $filters['sort'] ?? 'latest';

        if ($sort === 'oldest') {
            $query->oldest();
        } elseif ($sort === 'published_desc') {
            $query->orderByDesc('published_at')->orderByDesc('id');
        } elseif ($sort === 'published_asc') {
            $query->orderBy('published_at')->orderBy('id');
        } else {
            $query->latest();
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $blogs = $query->paginate($perPage);

        $blogs->setCollection(
            $blogs->getCollection()->map(fn ($blog) => $this->formatItem($blog))
        );

        return [
            'success' => true,
            'message' => 'Lay danh sach tin tuc thanh cong',
            'data' => [
                'items' => $blogs->items(),
                'meta' => [
                    'current_page' => $blogs->currentPage(),
                    'last_page' => $blogs->lastPage(),
                    'per_page' => $blogs->perPage(),
                    'total' => $blogs->total(),
                ],
            ],
        ];
    }

    public function show(int $id): array
    {
        $blog = Blog::query()->with('author:id,name,full_name')->find($id);

        if (!$blog) {
            throw new RuntimeException('Bai viet khong ton tai', 404);
        }

        return [
            'success' => true,
            'message' => 'Lay chi tiet tin tuc thanh cong',
            'data' => $this->formatDetail($blog),
        ];
    }

    public function store(array $data): array
    {
        $blog = Blog::query()->create([
            'author_id' => $data['author_id'] ?? null,
            'title' => $data['title'],
            'slug' => $this->buildUniqueSlug($data['title']),
            'summary' => $data['summary'] ?? null,
            'content' => $data['content'],
            'thumbnail' => $data['thumbnail'] ?? null,
            'status' => $data['status'],
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'published_at' => $this->resolvePublishedAt($data),
        ]);

        return [
            'success' => true,
            'message' => 'Tao bai viet thanh cong',
            'data' => $this->formatDetail($blog->fresh('author')),
        ];
    }

    public function update(int $id, array $data): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bai viet khong ton tai', 404);
        }

        $blog->update([
            'title' => $data['title'],
            'slug' => $this->buildUniqueSlug($data['title'], $blog->id),
            'summary' => $data['summary'] ?? null,
            'content' => $data['content'],
            'thumbnail' => $data['thumbnail'] ?? null,
            'status' => $data['status'],
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'published_at' => $this->resolvePublishedAt($data, $blog),
        ]);

        return [
            'success' => true,
            'message' => 'Cap nhat bai viet thanh cong',
            'data' => $this->formatDetail($blog->fresh('author')),
        ];
    }

    public function destroy(int $id): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bai viet khong ton tai', 404);
        }

        $blog->delete();

        return [
            'success' => true,
            'message' => 'Xoa bai viet thanh cong',
            'data' => null,
        ];
    }

    public function updateStatus(int $id, string $status): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bai viet khong ton tai', 404);
        }

        $blog->update([
            'status' => $status,
            'published_at' => $status === 'published'
                ? ($blog->published_at ?: now())
                : null,
        ]);

        return [
            'success' => true,
            'message' => $status === 'published' ? 'Da xuat ban bai viet' : 'Da chuyen bai viet ve ban nhap',
            'data' => $this->formatDetail($blog->fresh('author')),
        ];
    }

    private function resolvePublishedAt(array $data, ?Blog $blog = null)
    {
        if (!empty($data['published_at'])) {
            return $data['published_at'];
        }

        if (($data['status'] ?? 'draft') === 'published') {
            return $blog?->published_at ?: now();
        }

        return null;
    }

    private function buildUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $counter = 1;

        while (
            Blog::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function formatItem(Blog $blog): array
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $blog->summary,
            'thumbnail' => $blog->thumbnail,
            'author_id' => $blog->author_id,
            'author_name' => $blog->author?->full_name ?? $blog->author?->name ?? 'Quan tri CTUT Store',
            'status' => $blog->status,
            'is_featured' => (bool) $blog->is_featured,
            'published_at' => optional($blog->published_at)->format('d/m/Y H:i'),
            'created_at' => optional($blog->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($blog->updated_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatDetail(Blog $blog): array
    {
        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'summary' => $blog->summary,
            'content' => $blog->content,
            'thumbnail' => $blog->thumbnail,
            'author_id' => $blog->author_id,
            'author_name' => $blog->author?->full_name ?? $blog->author?->name ?? 'Quan tri CTUT Store',
            'status' => $blog->status,
            'is_featured' => (bool) $blog->is_featured,
            'published_at' => optional($blog->published_at)->format('Y-m-d\\TH:i'),
            'published_at_display' => optional($blog->published_at)->format('d/m/Y H:i'),
            'created_at' => optional($blog->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($blog->updated_at)->format('d/m/Y H:i'),
        ];
    }
}
