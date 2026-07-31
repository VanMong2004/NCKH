<?php

namespace App\Services\Admin;

use App\Models\Policy;
use Illuminate\Support\Str;
use RuntimeException;

class AdminPolicyService
{
    public function index(array $filters = []): array
    {
        $query = Policy::query();

        if (!empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%")
                    ->orWhere('type', 'like', "%{$keyword}%");
            });
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        ($filters['sort'] ?? 'latest') === 'oldest'
            ? $query->oldest()
            : $query->latest();

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);
        $policies = $query->paginate($perPage);

        $policies->setCollection(
            $policies->getCollection()->map(fn ($policy) => $this->formatItem($policy))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách chính sách thành công',
            'data' => $policies,
        ];
    }

    public function show(int $id): array
    {
        $policy = Policy::query()->find($id);

        if (!$policy) {
            throw new RuntimeException('Chính sách không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết chính sách thành công',
            'data' => $this->formatDetail($policy),
        ];
    }

    public function store(array $data): array
    {
        $policy = Policy::query()->create([
            'title' => $data['title'],
            'slug' => $this->buildUniqueSlug($data['slug'] ?? $data['title']),
            'type' => $data['type'],
            'content' => $data['content'],
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return [
            'success' => true,
            'message' => 'Tạo chính sách thành công',
            'data' => $this->formatDetail($policy),
        ];
    }

    public function update(int $id, array $data): array
    {
        $policy = Policy::query()->find($id);

        if (!$policy) {
            throw new RuntimeException('Chính sách không tồn tại', 404);
        }

        $policy->update([
            'title' => $data['title'],
            'slug' => $this->buildUniqueSlug($data['slug'] ?? $data['title'], $policy->id),
            'type' => $data['type'],
            'content' => $data['content'],
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        return [
            'success' => true,
            'message' => 'Cập nhật chính sách thành công',
            'data' => $this->formatDetail($policy->fresh()),
        ];
    }

    public function destroy(int $id): array
    {
        $policy = Policy::query()->find($id);

        if (!$policy) {
            throw new RuntimeException('Chính sách không tồn tại', 404);
        }

        $policy->delete();

        return [
            'success' => true,
            'message' => 'Xóa chính sách thành công',
            'data' => null,
        ];
    }

    public function toggleActive(int $id): array
    {
        $policy = Policy::query()->find($id);

        if (!$policy) {
            throw new RuntimeException('Chính sách không tồn tại', 404);
        }

        $policy->update([
            'is_active' => !$policy->is_active,
        ]);

        return [
            'success' => true,
            'message' => $policy->is_active ? 'Đã bật chính sách' : 'Đã tắt chính sách',
            'data' => $this->formatDetail($policy->fresh()),
        ];
    }

    private function buildUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value) ?: Str::random(8);
        $slug = $base;
        $counter = 1;

        while (
            Policy::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function formatItem(Policy $policy): array
    {
        return [
            'id' => $policy->id,
            'title' => $policy->title,
            'slug' => $policy->slug,
            'type' => $policy->type,
            'sort_order' => (int) $policy->sort_order,
            'is_active' => (bool) $policy->is_active,
            'content_preview' => Str::limit(trim(strip_tags((string) $policy->content)), 120),
            'created_at' => optional($policy->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($policy->updated_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatDetail(Policy $policy): array
    {
        return [
            'id' => $policy->id,
            'title' => $policy->title,
            'slug' => $policy->slug,
            'type' => $policy->type,
            'content' => $policy->content,
            'sort_order' => (int) $policy->sort_order,
            'is_active' => (bool) $policy->is_active,
            'created_at' => optional($policy->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($policy->updated_at)->format('d/m/Y H:i'),
        ];
    }
}
