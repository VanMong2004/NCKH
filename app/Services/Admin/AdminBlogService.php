<?php

namespace App\Services\Admin;

use App\Models\Blog;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use RuntimeException;

class AdminBlogService
{
    private ?bool $hasSummaryColumn = null;
    private ?bool $hasStatusColumn = null;
    private ?bool $hasAuthorIdColumn = null;

    public function index(array $filters = []): array
    {
        $query = Blog::query();

        if ($this->hasAuthorIdColumn()) {
            $query->with('author:id,name');
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere($this->summaryColumn(), 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['status'])) {
            if ($this->hasStatusColumn()) {
                $query->where('status', $filters['status']);
            } else {
                $query->where('is_published', $filters['status'] === 'published');
            }
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
            'message' => 'Lấy danh sách tin tức thành công',
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
        $query = Blog::query();

        if ($this->hasAuthorIdColumn()) {
            $query->with('author:id,name');
        }

        $blog = $query->find($id);

        if (!$blog) {
            throw new RuntimeException('Bài viết không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết tin tức thành công',
            'data' => $this->formatDetail($blog),
        ];
    }

    public function store(array $data): array
    {
        $blog = Blog::query()->create($this->buildPersistenceData($data));

        return [
            'success' => true,
            'message' => 'Tạo bài viết thành công',
            'data' => $this->formatDetail($this->refreshBlog($blog)),
        ];
    }

    public function update(int $id, array $data): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bài viết không tồn tại', 404);
        }

        $blog->update($this->buildPersistenceData($data, $blog));

        return [
            'success' => true,
            'message' => 'Cập nhật bài viết thành công',
            'data' => $this->formatDetail($this->refreshBlog($blog)),
        ];
    }

    public function destroy(int $id): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bài viết không tồn tại', 404);
        }

        if ($this->resolveStatus($blog) === 'published') {
            throw new RuntimeException('Không thể xóa bài viết đang xuất bản. Vui lòng chuyển về bản nháp trước khi xóa.', 422);
        }

        $blog->delete();

        return [
            'success' => true,
            'message' => 'Xóa bài viết thành công',
            'data' => null,
        ];
    }

    public function updateStatus(int $id, string $status): array
    {
        $blog = Blog::query()->find($id);

        if (!$blog) {
            throw new RuntimeException('Bài viết không tồn tại', 404);
        }

        $payload = [
            'published_at' => $status === 'published'
                ? ($blog->published_at ?: now())
                : null,
        ];

        if ($this->hasStatusColumn()) {
            $payload['status'] = $status;
        } else {
            $payload['is_published'] = $status === 'published';
        }

        $blog->update($payload);

        return [
            'success' => true,
            'message' => $status === 'published' ? 'Đã xuất bản bài viết' : 'Đã chuyển bài viết về bản nháp',
            'data' => $this->formatDetail($this->refreshBlog($blog)),
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
            'summary' => $this->resolveSummary($blog),
            'thumbnail' => $blog->thumbnail,
            'author_id' => $this->hasAuthorIdColumn() ? $blog->author_id : null,
            'author_name' => $this->resolveAuthorName($blog),
            'status' => $this->resolveStatus($blog),
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
            'summary' => $this->resolveSummary($blog),
            'content' => $blog->content,
            'thumbnail' => $blog->thumbnail,
            'author_id' => $this->hasAuthorIdColumn() ? $blog->author_id : null,
            'author_name' => $this->resolveAuthorName($blog),
            'status' => $this->resolveStatus($blog),
            'is_featured' => (bool) $blog->is_featured,
            'published_at' => optional($blog->published_at)->format('Y-m-d\\TH:i'),
            'published_at_display' => optional($blog->published_at)->format('d/m/Y H:i'),
            'created_at' => optional($blog->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($blog->updated_at)->format('d/m/Y H:i'),
        ];
    }

    private function resolveSummary(Blog $blog): ?string
    {
        if ($this->hasSummaryColumn()) {
            return $blog->summary;
        }

        return $blog->excerpt;
    }

    private function resolveStatus(Blog $blog): string
    {
        if ($this->hasStatusColumn()) {
            return $blog->status ?: 'draft';
        }

        return $blog->is_published ? 'published' : 'draft';
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
            return $blog->author?->full_name ?? $blog->author?->name ?? 'Quản trị CTUT UniShop';
        }

        return $blog->author_name ?: 'Quản trị CTUT UniShop';
    }

    private function buildPersistenceData(array $data, ?Blog $blog = null): array
    {
        $payload = [
            'title' => $data['title'],
            'slug' => $this->buildUniqueSlug($data['title'], $blog?->id),
            'content' => $data['content'],
            'thumbnail' => $this->normalizeThumbnailPath($data['thumbnail'] ?? null),
            'is_featured' => (bool) ($data['is_featured'] ?? false),
            'published_at' => $this->resolvePublishedAt($data, $blog),
        ];

        if ($this->hasSummaryColumn()) {
            $payload['summary'] = $data['summary'] ?? null;
        } else {
            $payload['excerpt'] = $data['summary'] ?? null;
        }

        if ($this->hasStatusColumn()) {
            $payload['status'] = $data['status'];
        } else {
            $payload['is_published'] = ($data['status'] ?? 'draft') === 'published';
        }

        if ($this->hasAuthorIdColumn()) {
            $payload['author_id'] = $data['author_id'] ?? $blog?->author_id;
        } elseif (!$blog) {
            $payload['author_name'] = trim((string) ($data['author_name'] ?? 'Quản trị CTUT UniShop')) ?: 'Quản trị CTUT UniShop';
        }

        return $payload;
    }

    private function refreshBlog(Blog $blog): Blog
    {
        if ($this->hasAuthorIdColumn()) {
            return $blog->fresh('author');
        }

        return $blog->fresh();
    }

    private function normalizeThumbnailPath(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            $path = parse_url($value, PHP_URL_PATH) ?: '';

            if ($path !== '' && str_starts_with($path, '/storage/')) {
                return ltrim(substr($path, strlen('/storage/')), '/');
            }

            return ltrim($path, '/');
        }

        if (str_starts_with($value, '/storage/')) {
            return ltrim(substr($value, strlen('/storage/')), '/');
        }

        return ltrim($value, '/');
    }
}
