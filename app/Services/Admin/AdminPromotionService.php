<?php

namespace App\Services\Admin;

use RuntimeException;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Product;
use App\Models\PromotionItem;
use Illuminate\Support\Facades\DB;
use App\Jobs\SendPromotionSocialAutomationJob;
use App\Services\Social\AiSocialCaptionService;
use App\Services\Social\N8nSocialAutomationService;
use App\Models\SocialAutomationLog;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;


class AdminPromotionService
{
    public function index(array $filters = []): array
    {
        $query = Promotion::query()
            ->withCount('items');

        if (!empty($filters['keyword'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%' . $filters['keyword'] . '%')
                    ->orWhere('slug', 'like', '%' . $filters['keyword'] . '%');
            });
        }

        if (!empty($filters['status'])) {
            if ($filters['status'] === 'upcoming') {
                $query->where('start_date', '>', now());
            } elseif ($filters['status'] === 'ended') {
                $query->where('end_date', '<', now());
            } else {
                $query->where('status', $filters['status']);
            }
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $promotions = $query
            ->latest()
            ->paginate($perPage);

        $promotions->setCollection(
            $promotions->getCollection()
                ->map(fn ($promotion) => $this->formatPromotion($promotion))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách khuyến mãi thành công',
            'data' => $promotions,
        ];
    }

    public function storeItemsBulk($promotionId, array $items): array
    {
        return DB::transaction(function () use ($promotionId, $items) {
            $promotion = Promotion::find($promotionId);

            if (!$promotion) {
                throw new RuntimeException('Khuyến mãi không tồn tại', 404);
            }

            if (($data['discount_type'] ?? null) === 'percent' && ($data['discount_value'] ?? 0) > 100) {
                throw new RuntimeException('Phần trăm giảm giá không được vượt quá 100%', 400);
            }

            $created = [];
            $skipped = [];

            foreach ($items as $index => $data) {
                try {
                    $this->validateVariantBelongsToProduct($data);
                    $this->validateProductIsSellable($data);
                    $this->validateLimitQuantity($data);

                    $productVariantId = $data['product_variant_id'] ?? null;
                    $variantUniqueKey = $productVariantId ? (int) $productVariantId : 0;

                    $exists = PromotionItem::where('promotion_id', $promotion->id)
                        ->where('product_id', $data['product_id'])
                        ->where('variant_unique_key', $variantUniqueKey)
                        ->exists();

                    if ($exists) {
                        $skipped[] = [
                            'index' => $index,
                            'product_id' => $data['product_id'],
                            'product_variant_id' => $data['product_variant_id'] ?? null,
                            'reason' => 'Sản phẩm/biến thể đã có trong khuyến mãi',
                        ];

                        continue;
                    }

                    $item = PromotionItem::create([
                        'promotion_id' => $promotion->id,
                        'product_id' => $data['product_id'],
                        'product_variant_id' => $productVariantId,
                        'variant_unique_key' => $variantUniqueKey,
                        'discount_type' => $data['discount_type'] ?? null,
                        'discount_value' => $data['discount_value'] ?? null,
                        'limit_quantity' => $data['limit_quantity'] ?? null,
                        'sold_quantity' => 0,
                        'reserved_quantity' => 0,
                        'is_active' => $data['is_active'] ?? true,
                    ]);

                    $created[] = $this->formatItem(
                        $item->load([
                            'product.images',
                            'productVariant',
                        ])
                    );

                } catch (RuntimeException $e) {
                    $skipped[] = [
                        'index' => $index,
                        'product_id' => $data['product_id'] ?? null,
                        'product_variant_id' => $data['product_variant_id'] ?? null,
                        'reason' => $e->getMessage(),
                    ];
                }
            }

            return [
                'success' => true,
                'message' => 'Thêm danh sách sản phẩm khuyến mãi hoàn tất',
                'data' => [
                    'created_count' => count($created),
                    'skipped_count' => count($skipped),
                    'created' => $created,
                    'skipped' => $skipped,
                ],
            ];
        });
    }

    public function store(array $data): array
    {
        $slug = $this->generateUniqueSlug($data['title']);

        $promotion = Promotion::create([
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'banner' => null,
            'thumbnail' => null,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => $data['status'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        $promotion->update([
            'banner' => !empty($data['banner_file'])
                ? $this->uploadPromotionImage($promotion, $data['banner_file'], 'banner')
                : null,

            'thumbnail' => !empty($data['thumbnail_file'])
                ? $this->uploadPromotionImage($promotion, $data['thumbnail_file'], 'thumbnail')
                : null,
        ]);

        return [
            'success' => true,
            'message' => 'Tạo khuyến mãi thành công',
            'data' => $this->formatPromotion($promotion->fresh()),
        ];
    }

    public function show($id): array
    {
        $promotion = Promotion::with([
            'items.product.images',
            'items.productVariant',
        ])->find($id);

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại', 404);
        }

        return $this->formatPromotionDetail($promotion);
    }

    public function update($id, array $data): array
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại', 404);
        }

        $slug = $this->generateUniqueSlug($data['title'], $promotion->id);

        $updateData = [
            'title' => $data['title'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => $data['status'],
            'is_active' => $data['is_active'] ?? true,
        ];

        if (!empty($data['banner_file'])) {
            $this->deletePublicFile($promotion->banner);
            $updateData['banner'] = $this->uploadPromotionImage($promotion, $data['banner_file'], 'banner');
        }

        if (!empty($data['thumbnail_file'])) {
            $this->deletePublicFile($promotion->thumbnail);
            $updateData['thumbnail'] = $this->uploadPromotionImage($promotion, $data['thumbnail_file'], 'thumbnail');
        }

        $promotion->update($updateData);

        return [
            'success' => true,
            'message' => 'Cập nhật khuyến mãi thành công',
            'data' => $this->formatPromotion($promotion->fresh()),
        ];
    }

    public function destroy($id): array
    {
        $promotion = Promotion::find($id);

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại', 404);
        }

        if (
            $promotion->items()
                ->where(function ($q) {
                    $q->where('sold_quantity', '>', 0)
                    ->orWhere('reserved_quantity', '>', 0);
                })
                ->exists()
        ) {
            $promotion->update([
                'is_active' => false,
                'status' => 'inactive',
            ]);

            return [
                'success' => true,
                'message' => 'Khuyến mãi đã có phát sinh bán hàng hoặc đang có đơn giữ chỗ nên hệ thống đã tắt khuyến mãi thay vì xóa',
                'data' => $this->formatPromotion($promotion->fresh()),
            ];
        }

        $promotion->delete();

        return [
            'success' => true,
            'message' => 'Xóa khuyến mãi thành công',
            'data' => null,
        ];
    }

    public function generateFacebookCaption($id, string $style = 'promotion'): array
    {
        $promotion = Promotion::query()
            ->with([
                'items.product.variants',
                'items.productVariant',
            ])
            ->find($id);

        if (!$promotion) {
            throw new RuntimeException('Đợt khuyến mãi không tồn tại', 404);
        }

        $this->ensurePromotionCanPostSocial($promotion, true);

        if ($promotion->items->count() <= 0) {
            throw new RuntimeException('Vui lòng thêm sản phẩm vào đợt khuyến mãi trước khi tạo nội dung Facebook', 422);
        }

        $caption = app(AiSocialCaptionService::class)
            ->generatePromotionCaption($promotion, $style);

        return [
            'success' => true,
            'message' => 'Đã tạo nội dung khuyến mãi bằng AI',
            'data' => $caption,
        ];
    }

    public function publishSocial($id, array $data = []): array
    {
        $promotion = Promotion::query()
            ->with([
                'items.product.variants',
                'items.productVariant',
            ])
            ->find($id);

        if (!$promotion) {
            throw new RuntimeException('Đợt khuyến mãi không tồn tại', 404);
        }

        $this->ensurePromotionCanPostSocial($promotion);

        if ($promotion->items->count() <= 0) {
            throw new RuntimeException(
                'Vui lòng thêm sản phẩm vào đợt khuyến mãi trước khi đăng Facebook',
                422
            );
        }

        $alreadySent = SocialAutomationLog::query()
            ->where('trigger_type', 'promotion_created')
            ->where('entity_type', 'promotion')
            ->where('entity_id', $promotion->id)
            ->whereIn('status', [
                'pending',
                'sending',
                'sent',
                'success',
            ])
            ->exists();

        if ($alreadySent) {
            throw new RuntimeException(
                'Đợt khuyến mãi này đã được gửi đăng Facebook trước đó',
                409
            );
        }

        $caption = trim((string) ($data['content'] ?? ''));
        $style = $data['style'] ?? null;

        $socialLog = app(N8nSocialAutomationService::class)
            ->createPromotionCreatedLog($promotion, $caption !== '' ? $caption : null, $style);

        SendPromotionSocialAutomationJob::dispatch($socialLog->id);

        return [
            'success' => true,
            'message' => 'Đã đưa đợt khuyến mãi vào hàng đợi đăng Facebook',
            'data' => [
                'log_id' => $socialLog->id,
                'status' => $socialLog->status,
                'promotion_id' => $promotion->id,
            ],
        ];
    }

    public function items($promotionId): array
    {
        $promotion = Promotion::find($promotionId);

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại', 404);
        }

        $items = PromotionItem::with([
            'product.images',
            'productVariant',
        ])
            ->where('promotion_id', $promotion->id)
            ->latest()
            ->get()
            ->map(fn ($item) => $this->formatItem($item))
            ->values();

        return [
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm khuyến mãi thành công',
            'data' => $items,
        ];
    }

    public function availableProducts($promotionId, $request): array
    {
        $promotion = Promotion::find($promotionId);

        if (!$promotion) {
            throw new RuntimeException('Khuyến mãi không tồn tại', 404);
        }

        $keyword = $request->keyword;
        $perPage = min(max((int) ($request->per_page ?? 10), 1), 100);

        $query = Product::query()
            ->with([
                'images',
                'category',
                'variants' => function ($q) {
                    $q->where('is_active', true)
                        ->whereRaw('(stock - reserved_stock) > 0')
                        ->orderBy('price');
                },
            ])
            ->where('is_active', true)
            ->whereHas('variants', function ($q) {
                $q->where('is_active', true)
                    ->whereRaw('(stock - reserved_stock) > 0');
            });

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('slug', 'like', "%{$keyword}%");
            });
        }

        $products = $query->latest()->paginate($perPage);

        $data = collect($products->items())->map(function ($product) use ($promotion) {
            $existingVariantKeys = PromotionItem::query()
                ->where('promotion_id', $promotion->id)
                ->where('product_id', $product->id)
                ->pluck('variant_unique_key')
                ->toArray();

            $variants = $product->variants
                ->map(function ($variant) use ($existingVariantKeys) {
                    $variantKey = (int) $variant->id;

                    return [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'price' => (float) $variant->price,
                        'stock' => (int) $variant->stock,
                        'reserved_stock' => (int) $variant->reserved_stock,
                        'available_stock' => max(0, (int) $variant->stock - (int) $variant->reserved_stock),
                        'is_active' => (bool) $variant->is_active,
                        'already_added' => in_array($variantKey, $existingVariantKeys),
                    ];
                })
                ->values();

            return [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category?->name,
                'thumbnail' => optional(
                    $product->images->where('type', 'thumbnail')->first()
                )->url ?? optional($product->images->first())->url,
                'is_active' => (bool) $product->is_active,
                'variants' => $variants,
            ];
        })->values();

        return [
            'success' => true,
            'message' => 'Lấy danh sách sản phẩm có thể thêm vào khuyến mãi thành công',
            'data' => $data,
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ];
    }

    public function storeItem($promotionId, array $data): array
    {
        return DB::transaction(function () use ($promotionId, $data) {
            $promotion = Promotion::find($promotionId);

            if (!$promotion) {
                throw new RuntimeException('Khuyến mãi không tồn tại', 404);
            }

            if (($data['discount_type'] ?? null) === 'percent' && ($data['discount_value'] ?? 0) > 100) {
                throw new RuntimeException('Phần trăm giảm giá không được vượt quá 100%', 400);
            }

            $this->validateVariantBelongsToProduct($data);
            $this->validateProductIsSellable($data);
            $this->validateLimitQuantity($data);

            $productVariantId = $data['product_variant_id'] ?? null;
            $variantUniqueKey = $productVariantId ? (int) $productVariantId : 0;

            $exists = PromotionItem::where('promotion_id', $promotion->id)
                ->where('product_id', $data['product_id'])
                ->where('variant_unique_key', $variantUniqueKey)
                ->exists();

            if ($exists) {
                throw new RuntimeException('Sản phẩm này đã có trong khuyến mãi', 409);
            }

            $item = PromotionItem::create([
                'promotion_id' => $promotion->id,
                'product_id' => $data['product_id'],
                'product_variant_id' => $productVariantId,
                'variant_unique_key' => $variantUniqueKey,
                'discount_type' => $data['discount_type'] ?? null,
                'discount_value' => $data['discount_value'] ?? null,
                'limit_quantity' => $data['limit_quantity'] ?? null,
                'sold_quantity' => 0,
                'reserved_quantity' => 0,
                'is_active' => $data['is_active'] ?? true,
            ]);

            return [
                'success' => true,
                'message' => 'Thêm sản phẩm vào khuyến mãi thành công',
                'data' => $this->formatItem($item->load([
                    'product.images',
                    'productVariant',
                ])),
            ];
        });
    }

    public function updateItem($itemId, array $data): array
    {
        return DB::transaction(function () use ($itemId, $data) {
            $item = PromotionItem::find($itemId);

            if (!$item) {
                throw new RuntimeException('Sản phẩm khuyến mãi không tồn tại', 404);
            }

            $finalProductId = $data['product_id'] ?? $item->product_id;

            $finalVariantId = array_key_exists('product_variant_id', $data)
                ? $data['product_variant_id']
                : $item->product_variant_id;

            $finalVariantUniqueKey = $finalVariantId ? (int) $finalVariantId : 0;

            $isChangingProductOrVariant =
                (int) $finalProductId !== (int) $item->product_id
                || (int) ($finalVariantId ?? 0) !== (int) ($item->product_variant_id ?? 0);

            if (
                $isChangingProductOrVariant
                && ($item->sold_quantity > 0 || $item->reserved_quantity > 0)
            ) {
                throw new RuntimeException(
                    'Sản phẩm khuyến mãi đã phát sinh bán hàng hoặc đang giữ chỗ nên không được đổi sản phẩm/biến thể',
                    400
                );
            }

            if (!empty($data['product_id']) || array_key_exists('product_variant_id', $data)) {
                $this->validateVariantBelongsToProduct([
                    'product_id' => $finalProductId,
                    'product_variant_id' => $finalVariantId,
                ]);
            }

            $exists = PromotionItem::where('promotion_id', $item->promotion_id)
                ->where('product_id', $finalProductId)
                ->where('variant_unique_key', $finalVariantUniqueKey)
                ->where('id', '!=', $item->id)
                ->exists();

            if ($exists) {
                throw new RuntimeException(
                    'Sản phẩm/biến thể này đã tồn tại trong chương trình khuyến mãi',
                    409
                );
            }

            $finalLimitQuantity = array_key_exists('limit_quantity', $data)
                ? $data['limit_quantity']
                : $item->limit_quantity;

            $this->validateLimitQuantity([
                'product_variant_id' => $finalVariantId,
                'limit_quantity' => $finalLimitQuantity,
            ], $item->id);

            if (
                $finalLimitQuantity !== null
                && (int) $finalLimitQuantity < (
                    (int) $item->sold_quantity + (int) $item->reserved_quantity
                )
            ) {
                throw new RuntimeException(
                    'Giới hạn mới không được nhỏ hơn số lượng đã bán hoặc đang giữ chỗ',
                    400
                );
            }

            $item->update([
                'product_id' => $finalProductId,
                'product_variant_id' => $finalVariantId,
                'variant_unique_key' => $finalVariantUniqueKey,

                'discount_type' => array_key_exists('discount_type', $data)
                    ? $data['discount_type']
                    : $item->discount_type,

                'discount_value' => array_key_exists('discount_value', $data)
                    ? $data['discount_value']
                    : $item->discount_value,

                'limit_quantity' => $finalLimitQuantity,

                'is_active' => array_key_exists('is_active', $data)
                    ? $data['is_active']
                    : $item->is_active,
            ]);

            return [
                'success' => true,
                'message' => 'Cập nhật sản phẩm khuyến mãi thành công',
                'data' => $this->formatItem($item->fresh()->load([
                    'product.images',
                    'productVariant',
                ])),
            ];
        });
    }

    public function destroyItem($itemId): array
    {
        $item = PromotionItem::find($itemId);

        if (!$item) {
            throw new RuntimeException('Sản phẩm khuyến mãi không tồn tại', 404);
        }

        if ($item->sold_quantity > 0 || $item->reserved_quantity > 0) {
            $item->update([
                'is_active' => false,
            ]);

            return [
                'success' => true,
                'message' => 'Sản phẩm khuyến mãi đã phát sinh bán hàng nên hệ thống đã tắt thay vì xóa',
                'data' => $this->formatItem($item->fresh()->load([
                    'product.images',
                    'productVariant',
                ])),
            ];
        }

        $item->delete();

        return [
            'success' => true,
            'message' => 'Xóa sản phẩm khỏi khuyến mãi thành công',
            'data' => null,
        ];
    }

    private function validateVariantBelongsToProduct(array $data): void
    {
        if (empty($data['product_variant_id'])) {
            return;
        }

        $variant = ProductVariant::where('id', $data['product_variant_id'])
            ->where('product_id', $data['product_id'])
            ->first();

        if (!$variant) {
            throw new RuntimeException('Biến thể không thuộc sản phẩm đã chọn', 400);
        }
    }
    
    private function validateProductIsSellable(array $data): void
    {
        $product = Product::find($data['product_id']);

        if (!$product || !$product->is_active) {
            throw new RuntimeException('Sản phẩm không còn được mở bán', 400);
        }

        if (!empty($data['product_variant_id'])) {
            $variant = ProductVariant::where('product_id', $product->id)
                ->where('id', $data['product_variant_id'])
                ->first();

            if (!$variant || !$variant->is_active) {
                throw new RuntimeException('Biến thể sản phẩm không còn được mở bán', 400);
            }

            if (($variant->stock - $variant->reserved_stock) <= 0) {
                throw new RuntimeException('Biến thể sản phẩm đã hết hàng', 400);
            }
        }
    }

    private function ensurePromotionCanPostSocial(Promotion $promotion, bool $forCaption = false): void
    {
        $action = $forCaption ? 'tạo nội dung Facebook' : 'đăng Facebook';

        if (!$promotion->is_active) {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi đang tắt", 422);
        }

        if ($promotion->status === 'draft' || $promotion->computed_status === 'draft') {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi chưa hoạt động", 422);
        }

        if ($promotion->status === 'inactive' || $promotion->computed_status === 'inactive') {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi đang tắt", 422);
        }

        if ($promotion->computed_status === 'upcoming' || now()->lt($promotion->start_date)) {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi chưa hoạt động", 422);
        }

        if ($promotion->computed_status === 'ended' || now()->gt($promotion->end_date)) {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi đã kết thúc", 422);
        }

        $activeItems = $promotion->items->filter(fn ($item) => (bool) $item->is_active);

        if ($activeItems->isEmpty()) {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi chưa có sản phẩm áp dụng", 422);
        }

        $hasSellableProduct = $activeItems->contains(function ($item) {
            $product = $item->product;

            if (!$product || !$product->is_active) {
                return false;
            }

            if ($item->productVariant) {
                return (bool) $item->productVariant->is_active;
            }

            return $product->variants
                ->where('is_active', true)
                ->isNotEmpty();
        });

        if (!$hasSellableProduct) {
            throw new RuntimeException("Không thể {$action} vì khuyến mãi chưa có sản phẩm áp dụng", 422);
        }
    }

    private function formatPromotion(Promotion $promotion): array
    {
        return [
            'id' => $promotion->id,
            'title' => $promotion->title,
            'slug' => $promotion->slug,
            'description' => $promotion->description,
            'banner' => $promotion->banner,
            'thumbnail' => $promotion->thumbnail,
            'discount_type' => $promotion->discount_type,
            'discount_value' => (float) $promotion->discount_value,
            'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
            'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
            'status' => $promotion->status,
            'computed_status' => $promotion->computed_status,
            'is_active' => (bool) $promotion->is_active,
            'items_count' => $promotion->items_count ?? $promotion->items()->count(),
            'created_at' => optional($promotion->created_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatPromotionDetail(Promotion $promotion): array
    {
        return [
            ...$this->formatPromotion($promotion),
            'items' => $promotion->items
                ->map(fn ($item) => $this->formatItem($item))
                ->values(),
        ];
    }

    private function formatItem(PromotionItem $item): array
    {
        $product = $item->product;
        $variant = $item->productVariant;

        return [
            'id' => $item->id,
            'promotion_id' => $item->promotion_id,

            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'thumbnail' => optional(
                    $product->images?->where('type', 'thumbnail')->first()
                )->url ?? optional($product->images?->first())->url,
            ] : null,

            'variant' => $variant ? [
                'id' => $variant->id,
                'sku' => $variant->sku,
                'size' => $variant->size,
                'color' => $variant->color,
                'attributes' => $variant->attributes,
                'price' => (float) $variant->price,
            ] : null,

            'discount_type' => $item->discount_type,
            'discount_value' => $item->discount_value,
            'limit_quantity' => $item->limit_quantity,
            'sold_quantity' => $item->sold_quantity,
            'reserved_quantity' => (int) $item->reserved_quantity,
            'remaining_quantity' => is_null($item->limit_quantity)
                ? null
                : max(
                    0,
                    $item->limit_quantity
                    - $item->sold_quantity
                    - $item->reserved_quantity
                ),
            'is_active' => (bool) $item->is_active,
            'created_at' => optional($item->created_at)->format('d/m/Y H:i'),
        ];
    }

    private function validateLimitQuantity(array $data, ?int $ignoreItemId = null): void
    {
        if (
            empty($data['product_variant_id'])
            || empty($data['limit_quantity'])
        ) {
            return;
        }

        $variant = ProductVariant::find($data['product_variant_id']);

        if (!$variant) {
            throw new RuntimeException(
                'Biến thể sản phẩm không tồn tại',
                404
            );
        }

        $availableStock = max(
            0,
            $variant->stock - $variant->reserved_stock
        );

        $usedLimit = PromotionItem::query()
            ->join('promotions', 'promotions.id', '=', 'promotion_items.promotion_id')
            ->where('promotion_items.product_variant_id', $variant->id)
            ->whereNotNull('promotion_items.limit_quantity')
            ->where('promotion_items.is_active', true)
            ->where('promotions.is_active', true)
            ->where('promotions.status', 'active')
            ->where('promotions.end_date', '>=', now())
            ->when($ignoreItemId, function ($q) use ($ignoreItemId) {
                $q->where('promotion_items.id', '!=', $ignoreItemId);
            })
            ->sum('promotion_items.limit_quantity');

        $maxAllowed = max(0, $availableStock - $usedLimit);

        if ((int) $data['limit_quantity'] > $maxAllowed) {
            throw new RuntimeException(
                "Số lượng khuyến mãi tối đa còn có thể áp dụng cho biến thể này là {$maxAllowed}",
                400
            );
        }
    }

    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (
            Promotion::query()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function uploadPromotionImage($promotion, $image, string $type): string
    {
        $folderName = Str::slug($promotion->slug ?: $promotion->title);

        $folderPath = public_path('images/promotions/' . $folderName);

        if (!File::exists($folderPath)) {
            File::makeDirectory($folderPath, 0755, true);
        }

        $originalName = pathinfo(
            $image->getClientOriginalName(),
            PATHINFO_FILENAME
        );

        $extension = $image->getClientOriginalExtension();

        $fileName = $type
            . '-'
            . Str::slug($originalName)
            . '-'
            . uniqid()
            . '.'
            . $extension;

        $image->move($folderPath, $fileName);

        return url('images/promotions/' . $folderName . '/' . $fileName);
    }

    private function deletePublicFile(?string $url): void
    {
        if (!$url) {
            return;
        }

        $path = str_replace(url('/'), '', $url);

        $fullPath = public_path($path);

        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }
}
