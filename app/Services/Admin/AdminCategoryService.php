<?php

namespace App\Services\Admin;

use App\Models\Category;
use Illuminate\Support\Str;
use RuntimeException;

class AdminCategoryService
{
    public function index(array $filters = []): array
    {
        $query = Category::query()
            ->with('parent:id,name')
            ->withCount(['products', 'children']);

        if (!empty($filters['with_deleted'])) {
            $query->withTrashed();
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
        }

        if (array_key_exists('parent_id', $filters) && $filters['parent_id'] !== null && $filters['parent_id'] !== '') {
            $filters['parent_id'] === 'root'
                ? $query->whereNull('parent_id')
                : $query->where('parent_id', (int) $filters['parent_id']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        match ($filters['sort'] ?? 'sort_order') {
            'latest' => $query->latest(),
            'oldest' => $query->oldest(),
            'name' => $query->orderBy('name'),
            default => $query->orderBy('sort_order')->orderBy('name'),
        };

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);
        $categories = $query->paginate($perPage);

        $categories->setCollection(
            $categories->getCollection()->map(fn ($category) => $this->format($category))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách danh mục thành công',
            'data' => [
                'categories' => $categories,
                'stats' => $this->stats(),
                'parents' => $this->parentOptions(),
            ],
        ];
    }

    public function show(int $id): array
    {
        $category = Category::withTrashed()
            ->with('parent:id,name')
            ->withCount(['products', 'children'])
            ->find($id);

        if (!$category) {
            throw new RuntimeException('Danh mục không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết danh mục thành công',
            'data' => $this->format($category),
        ];
    }

    public function store(array $data): array
    {
        $category = Category::create($this->payload($data));

        return [
            'success' => true,
            'message' => 'Đã thêm danh mục',
            'data' => $this->format($category->fresh(['parent'])->loadCount(['products', 'children'])),
        ];
    }

    public function update(int $id, array $data): array
    {
        $category = Category::find($id);

        if (!$category) {
            throw new RuntimeException('Danh mục không tồn tại', 404);
        }

        if (!empty($data['parent_id']) && (int) $data['parent_id'] === $category->id) {
            throw new RuntimeException('Danh mục cha không hợp lệ', 422);
        }

        $category->update($this->payload($data, $category->id));

        return [
            'success' => true,
            'message' => 'Đã cập nhật danh mục',
            'data' => $this->format($category->fresh(['parent'])->loadCount(['products', 'children'])),
        ];
    }

    public function toggleActive(int $id, bool $isActive): array
    {
        $category = Category::find($id);

        if (!$category) {
            throw new RuntimeException('Danh mục không tồn tại', 404);
        }

        $category->update(['is_active' => $isActive]);

        return [
            'success' => true,
            'message' => $isActive ? 'Đã bật danh mục' : 'Đã tắt danh mục',
            'data' => $this->format($category->fresh(['parent'])->loadCount(['products', 'children'])),
        ];
    }

    public function destroy(int $id): array
    {
        $category = Category::withCount(['products', 'children'])->find($id);

        if (!$category) {
            throw new RuntimeException('Danh mục không tồn tại', 404);
        }

        if ($category->products_count > 0 || $category->children_count > 0) {
            throw new RuntimeException('Không thể xóa danh mục vì vẫn còn sản phẩm hoặc danh mục con liên kết', 409);
        }

        $category->delete();

        return [
            'success' => true,
            'message' => 'Đã xóa danh mục',
            'data' => null,
        ];
    }

    public function activeOptions(): array
    {
        return Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent_id' => $category->parent_id,
            ])
            ->values()
            ->toArray();
    }

    private function payload(array $data, ?int $ignoreId = null): array
    {
        return [
            'name' => trim($data['name']),
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['name'], $ignoreId),
            'description' => $data['description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ];
    }

    private function uniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $index = 2;

        while (Category::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base . '-' . $index++;
        }

        return $slug;
    }

    private function stats(): array
    {
        return [
            'total' => Category::query()->count(),
            'active' => Category::query()->where('is_active', true)->count(),
            'inactive' => Category::query()->where('is_active', false)->count(),
            'parents' => Category::query()->whereNull('parent_id')->count(),
            'children' => Category::query()->whereNotNull('parent_id')->count(),
        ];
    }

    private function parentOptions(): array
    {
        return Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'parent_id' => $category->parent_id,
            ])
            ->values()
            ->toArray();
    }

    private function format(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'parent_id' => $category->parent_id,
            'parent_name' => $category->parent?->name,
            'description' => $category->description,
            'image' => $category->image,
            'icon' => $category->icon,
            'is_active' => (bool) $category->is_active,
            'sort_order' => (int) $category->sort_order,
            'products_count' => (int) ($category->products_count ?? 0),
            'children_count' => (int) ($category->children_count ?? 0),
            'created_at' => optional($category->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($category->updated_at)->format('d/m/Y H:i'),
        ];
    }
}
