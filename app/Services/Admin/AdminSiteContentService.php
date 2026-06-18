<?php

namespace App\Services\Admin;

use App\Models\SiteComponent;
use App\Models\SiteComponentItem;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminSiteContentService
{
    public function index(array $filters = [])
    {
        $query = SiteComponent::query()
            ->withCount('items')
            ->orderBy('sort_order')
            ->orderBy('id');

        if (!empty($filters['page_key'])) {
            $query->where('page_key', $filters['page_key']);
        }

        if (!empty($filters['component_key'])) {
            $query->where('component_key', $filters['component_key']);
        }

        if (!empty($filters['component_type'])) {
            $query->where('component_type', $filters['component_type']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);

            $query->where(function ($q) use ($keyword) {
                $q->where('page_name', 'like', "%{$keyword}%")
                    ->orWhere('component_name', 'like', "%{$keyword}%")
                    ->orWhere('component_key', 'like', "%{$keyword}%")
                    ->orWhere('title', 'like', "%{$keyword}%")
                    ->orWhere('subtitle', 'like', "%{$keyword}%");
            });
        }

        return $query->get()
            ->map(fn ($component) => $this->formatComponentSummary($component))
            ->values();
    }

    public function show(int $id): array
    {
        $component = SiteComponent::query()
            ->with([
                'rootItems.children',
            ])
            ->find($id);

        if (!$component) {
            throw new RuntimeException('Không tìm thấy component nội dung', 404);
        }

        return $this->formatComponentDetail($component);
    }

    public function store(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $exists = SiteComponent::query()
                ->where('page_key', $data['page_key'] ?? 'home')
                ->where('component_key', $data['component_key'])
                ->exists();

            if ($exists) {
                throw new RuntimeException('Component này đã tồn tại trên trang đã chọn', 422);
            }

            $component = SiteComponent::create($this->normalizeComponentData($data));

            return $this->show($component->id);
        });
    }

    public function update(int $id, array $data): array
    {
        return DB::transaction(function () use ($id, $data) {
            $component = SiteComponent::query()
                ->lockForUpdate()
                ->find($id);

            if (!$component) {
                throw new RuntimeException('Không tìm thấy component nội dung', 404);
            }

            $pageKey = $data['page_key'] ?? $component->page_key;
            $componentKey = $data['component_key'] ?? $component->component_key;

            $duplicated = SiteComponent::query()
                ->where('page_key', $pageKey)
                ->where('component_key', $componentKey)
                ->where('id', '!=', $component->id)
                ->exists();

            if ($duplicated) {
                throw new RuntimeException('Component này đã tồn tại trên trang đã chọn', 422);
            }

            $component->update($this->normalizeComponentData($data, partial: true));

            return $this->show($component->id);
        });
    }

    public function destroy(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $component = SiteComponent::query()
                ->lockForUpdate()
                ->find($id);

            if (!$component) {
                throw new RuntimeException('Không tìm thấy component nội dung', 404);
            }

            $component->delete();

            return [
                'deleted' => true,
            ];
        });
    }

    public function toggle(int $id): array
    {
        return DB::transaction(function () use ($id) {
            $component = SiteComponent::query()
                ->lockForUpdate()
                ->find($id);

            if (!$component) {
                throw new RuntimeException('Không tìm thấy component nội dung', 404);
            }

            $component->update([
                'is_active' => !$component->is_active,
            ]);

            return $this->show($component->id);
        });
    }

    public function storeItem(int $componentId, array $data): array
    {
        return DB::transaction(function () use ($componentId, $data) {
            $component = SiteComponent::query()
                ->lockForUpdate()
                ->find($componentId);

            if (!$component) {
                throw new RuntimeException('Không tìm thấy component nội dung', 404);
            }

            $this->validateParentItem($component->id, $data['parent_id'] ?? null);

            if (!empty($data['item_key'])) {
                $exists = SiteComponentItem::query()
                    ->where('component_id', $component->id)
                    ->where('item_key', $data['item_key'])
                    ->exists();

                if ($exists) {
                    throw new RuntimeException('Mã item này đã tồn tại trong component', 422);
                }
            }

            $item = $component->items()->create($this->normalizeItemData($data));

            return $this->formatItemDetail(
                SiteComponentItem::query()
                    ->with('children')
                    ->find($item->id)
            );
        });
    }

    public function updateItem(int $itemId, array $data): array
    {
        return DB::transaction(function () use ($itemId, $data) {
            $item = SiteComponentItem::query()
                ->lockForUpdate()
                ->find($itemId);

            if (!$item) {
                throw new RuntimeException('Không tìm thấy item nội dung', 404);
            }

            $this->validateParentItem($item->component_id, $data['parent_id'] ?? $item->parent_id, $item->id);

            if (!empty($data['item_key'])) {
                $duplicated = SiteComponentItem::query()
                    ->where('component_id', $item->component_id)
                    ->where('item_key', $data['item_key'])
                    ->where('id', '!=', $item->id)
                    ->exists();

                if ($duplicated) {
                    throw new RuntimeException('Mã item này đã tồn tại trong component', 422);
                }
            }

            $item->update($this->normalizeItemData($data, partial: true));

            return $this->formatItemDetail(
                SiteComponentItem::query()
                    ->with('children')
                    ->find($item->id)
            );
        });
    }

    public function destroyItem(int $itemId): array
    {
        return DB::transaction(function () use ($itemId) {
            $item = SiteComponentItem::query()
                ->lockForUpdate()
                ->find($itemId);

            if (!$item) {
                throw new RuntimeException('Không tìm thấy item nội dung', 404);
            }

            $item->delete();

            return [
                'deleted' => true,
            ];
        });
    }

    public function toggleItem(int $itemId): array
    {
        return DB::transaction(function () use ($itemId) {
            $item = SiteComponentItem::query()
                ->lockForUpdate()
                ->find($itemId);

            if (!$item) {
                throw new RuntimeException('Không tìm thấy item nội dung', 404);
            }

            $item->update([
                'is_active' => !$item->is_active,
            ]);

            return $this->formatItemDetail($item->fresh('children'));
        });
    }

    public function reorderItems(int $componentId, array $items): array
    {
        return DB::transaction(function () use ($componentId, $items) {
            $component = SiteComponent::query()
                ->lockForUpdate()
                ->find($componentId);

            if (!$component) {
                throw new RuntimeException('Không tìm thấy component nội dung', 404);
            }

            foreach ($items as $row) {
                if (empty($row['id'])) {
                    continue;
                }

                SiteComponentItem::query()
                    ->where('component_id', $component->id)
                    ->where('id', $row['id'])
                    ->update([
                        'sort_order' => (int) ($row['sort_order'] ?? 0),
                    ]);
            }

            return $this->show($component->id);
        });
    }

    private function normalizeComponentData(array $data, bool $partial = false): array
    {
        $fields = [
            'page_key',
            'page_name',
            'component_key',
            'component_name',
            'component_type',
            'title',
            'subtitle',
            'content',
            'image',
            'mobile_image',
            'payload',
            'sort_order',
            'is_active',
        ];

        $normalized = [];

        foreach ($fields as $field) {
            if (!$partial || array_key_exists($field, $data)) {
                $normalized[$field] = $data[$field] ?? null;
            }
        }

        if (!$partial) {
            $normalized['page_key'] = $normalized['page_key'] ?: 'home';
            $normalized['page_name'] = $normalized['page_name'] ?: 'Trang chủ';
            $normalized['component_type'] = $normalized['component_type'] ?: 'section';
            $normalized['sort_order'] = (int) ($normalized['sort_order'] ?? 0);
            $normalized['is_active'] = array_key_exists('is_active', $normalized)
                ? (bool) $normalized['is_active']
                : true;
        }

        if (array_key_exists('sort_order', $normalized)) {
            $normalized['sort_order'] = (int) ($normalized['sort_order'] ?? 0);
        }

        if (array_key_exists('is_active', $normalized)) {
            $normalized['is_active'] = (bool) $normalized['is_active'];
        }

        if (array_key_exists('payload', $normalized)) {
            $normalized['payload'] = $this->normalizePayload($normalized['payload'] ?? null);
        }

        return $normalized;
    }

    private function normalizeItemData(array $data, bool $partial = false): array
    {
        $fields = [
            'parent_id',
            'group_key',
            'item_key',
            'item_type',
            'label',
            'title',
            'subtitle',
            'content',
            'icon_key',
            'image',
            'mobile_image',
            'link_text',
            'link_url',
            'target',
            'payload',
            'sort_order',
            'is_active',
        ];

        $normalized = [];

        foreach ($fields as $field) {
            if (!$partial || array_key_exists($field, $data)) {
                $normalized[$field] = $data[$field] ?? null;
            }
        }

        if (!$partial) {
            $normalized['item_type'] = $normalized['item_type'] ?: 'link';
            $normalized['target'] = $normalized['target'] ?: '_self';
            $normalized['sort_order'] = (int) ($normalized['sort_order'] ?? 0);
            $normalized['is_active'] = array_key_exists('is_active', $normalized)
                ? (bool) $normalized['is_active']
                : true;
        }

        if (array_key_exists('sort_order', $normalized)) {
            $normalized['sort_order'] = (int) ($normalized['sort_order'] ?? 0);
        }

        if (array_key_exists('is_active', $normalized)) {
            $normalized['is_active'] = (bool) $normalized['is_active'];
        }

        if (array_key_exists('payload', $normalized)) {
            $normalized['payload'] = $this->normalizePayload($normalized['payload'] ?? null);
        }

        if (array_key_exists('target', $normalized) && empty($normalized['target'])) {
            $normalized['target'] = '_self';
        }

        return $normalized;
    }

    private function normalizePayload($payload): ?array
    {
        if ($payload === null || $payload === '') {
            return null;
        }

        if (is_array($payload)) {
            return $payload;
        }

        if (is_string($payload)) {
            $decoded = json_decode($payload, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new RuntimeException('Payload phải là JSON hợp lệ', 422);
            }

            return $decoded;
        }

        throw new RuntimeException('Payload không hợp lệ', 422);
    }

    private function validateParentItem(int $componentId, $parentId = null, ?int $currentItemId = null): void
    {
        if (!$parentId) {
            return;
        }

        if ($currentItemId && (int) $parentId === $currentItemId) {
            throw new RuntimeException('Item không thể là cha của chính nó', 422);
        }

        $parent = SiteComponentItem::query()
            ->where('component_id', $componentId)
            ->where('id', $parentId)
            ->first();

        if (!$parent) {
            throw new RuntimeException('Item cha không tồn tại trong component này', 422);
        }
    }

    private function formatComponentSummary(SiteComponent $component): array
    {
        return [
            'id' => $component->id,
            'page_key' => $component->page_key,
            'page_name' => $component->page_name,
            'component_key' => $component->component_key,
            'component_name' => $component->component_name,
            'component_type' => $component->component_type,
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'image' => $component->image,
            'mobile_image' => $component->mobile_image,
            'sort_order' => (int) $component->sort_order,
            'is_active' => (bool) $component->is_active,
            'items_count' => (int) ($component->items_count ?? 0),
            'updated_at' => optional($component->updated_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatComponentDetail(SiteComponent $component): array
    {
        return [
            'id' => $component->id,
            'page_key' => $component->page_key,
            'page_name' => $component->page_name,
            'component_key' => $component->component_key,
            'component_name' => $component->component_name,
            'component_type' => $component->component_type,
            'title' => $component->title,
            'subtitle' => $component->subtitle,
            'content' => $component->content,
            'image' => $component->image,
            'mobile_image' => $component->mobile_image,
            'payload' => $component->payload ?? [],
            'sort_order' => (int) $component->sort_order,
            'is_active' => (bool) $component->is_active,
            'items' => $component->rootItems
                ->map(fn ($item) => $this->formatItemDetail($item))
                ->values(),
            'created_at' => optional($component->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($component->updated_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatItemDetail(?SiteComponentItem $item): ?array
    {
        if (!$item) {
            return null;
        }

        return [
            'id' => $item->id,
            'component_id' => $item->component_id,
            'parent_id' => $item->parent_id,
            'group_key' => $item->group_key,
            'item_key' => $item->item_key,
            'item_type' => $item->item_type,
            'label' => $item->label,
            'title' => $item->title,
            'subtitle' => $item->subtitle,
            'content' => $item->content,
            'icon_key' => $item->icon_key,
            'image' => $item->image,
            'mobile_image' => $item->mobile_image,
            'link_text' => $item->link_text,
            'link_url' => $item->link_url,
            'target' => $item->target,
            'payload' => $item->payload ?? [],
            'sort_order' => (int) $item->sort_order,
            'is_active' => (bool) $item->is_active,
            'children' => $item->children
                ? $item->children->map(fn ($child) => $this->formatItemDetail($child))->values()
                : [],
            'created_at' => optional($item->created_at)->format('d/m/Y H:i'),
            'updated_at' => optional($item->updated_at)->format('d/m/Y H:i'),
        ];
    }
}