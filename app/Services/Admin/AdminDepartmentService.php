<?php

namespace App\Services\Admin;

use App\Models\Department;
use Illuminate\Support\Str;
use RuntimeException;

class AdminDepartmentService
{
    public function index(array $filters = []): array
    {
        $query = Department::query()->withCount('products');

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('code', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%");
            });
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
        $departments = $query->paginate($perPage);

        $departments->setCollection(
            $departments->getCollection()->map(fn ($department) => $this->format($department))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách đơn vị/khoa thành công',
            'data' => [
                'departments' => $departments,
                'stats' => $this->stats(),
            ],
        ];
    }

    public function show(int $id): array
    {
        $department = Department::query()->withCount('products')->find($id);

        if (!$department) {
            throw new RuntimeException('Đơn vị/khoa không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết đơn vị/khoa thành công',
            'data' => $this->format($department),
        ];
    }

    public function store(array $data): array
    {
        $department = Department::create($this->payload($data));

        return [
            'success' => true,
            'message' => 'Đã thêm đơn vị/khoa',
            'data' => $this->format($department->fresh()->loadCount('products')),
        ];
    }

    public function update(int $id, array $data): array
    {
        $department = Department::find($id);

        if (!$department) {
            throw new RuntimeException('Đơn vị/khoa không tồn tại', 404);
        }

        $department->update($this->payload($data, $department->id));

        return [
            'success' => true,
            'message' => 'Đã cập nhật đơn vị/khoa',
            'data' => $this->format($department->fresh()->loadCount('products')),
        ];
    }

    public function toggleActive(int $id, bool $isActive): array
    {
        $department = Department::find($id);

        if (!$department) {
            throw new RuntimeException('Đơn vị/khoa không tồn tại', 404);
        }

        $department->update(['is_active' => $isActive]);

        return [
            'success' => true,
            'message' => $isActive ? 'Đã bật đơn vị/khoa' : 'Đã tắt đơn vị/khoa',
            'data' => $this->format($department->fresh()->loadCount('products')),
        ];
    }

    public function destroy(int $id): array
    {
        $department = Department::withCount('products')->find($id);

        if (!$department) {
            throw new RuntimeException('Đơn vị/khoa không tồn tại', 404);
        }

        if ($department->products_count > 0) {
            throw new RuntimeException('Không thể xóa đơn vị/khoa vì vẫn còn sản phẩm liên kết', 409);
        }

        $department->delete();

        return [
            'success' => true,
            'message' => 'Đã xóa đơn vị/khoa',
            'data' => null,
        ];
    }

    public function activeOptions(): array
    {
        return Department::query()
            ->select(['id', 'name', 'slug', 'code', 'sort_order'])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($department) => [
                'id' => $department->id,
                'name' => $department->name,
                'slug' => $department->slug,
                'code' => $department->code,
            ])
            ->values()
            ->toArray();
    }

    private function payload(array $data, ?int $ignoreId = null): array
    {
        return [
            'name' => trim($data['name']),
            'code' => filled($data['code'] ?? null) ? trim($data['code']) : null,
            'slug' => $this->uniqueSlug($data['slug'] ?? $data['name'], $ignoreId),
            'description' => $data['description'] ?? null,
            'is_active' => (bool) ($data['is_active'] ?? true),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ];
    }

    private function uniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $index = 2;

        while (Department::query()
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
            'total' => Department::query()->count(),
            'active' => Department::query()->where('is_active', true)->count(),
            'inactive' => Department::query()->where('is_active', false)->count(),
        ];
    }

    private function format(Department $department): array
    {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'slug' => $department->slug,
            'description' => $department->description,
            'is_active' => (bool) $department->is_active,
            'sort_order' => (int) $department->sort_order,
            'products_count' => (int) ($department->products_count ?? 0),
            'created_at' => optional($department->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($department->updated_at)->format('d/m/Y H:i'),
        ];
    }
}
