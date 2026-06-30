<?php

namespace App\Services\Social;

use App\Models\Product;
use App\Models\Promotion;
use App\Models\SocialAutomationLog;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class N8nSocialAutomationService
{
    public function createProductCreatedLog(Product $product, ?string $caption = null, ?string $style = null): SocialAutomationLog
    {
        $payload = $this->buildProductCreatedPayload($product, $caption, $style);

        return SocialAutomationLog::create([
            'trigger_type' => 'product_created',
            'entity_type' => 'product',
            'entity_id' => $product->id,
            'platform' => 'all',
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    public function sendLogToN8n(SocialAutomationLog $log): array
    {
        if (!config('services.n8n.social_enabled')) {
            $log->update([
                'status' => 'skipped',
                'error_message' => 'N8N social automation đang tắt',
                'completed_at' => now(),
            ]);

            return [
                'success' => false,
                'message' => 'N8N social automation đang tắt',
            ];
        }

        $webhookUrl = config('services.n8n.social_webhook_url');
        $secret = config('services.n8n.social_webhook_secret');

        if (!$webhookUrl) {
            throw new RuntimeException('Chưa cấu hình N8N_SOCIAL_WEBHOOK_URL', 500);
        }

        if (!$secret) {
            throw new RuntimeException('Chưa cấu hình N8N_SOCIAL_WEBHOOK_SECRET', 500);
        }

        $log->update([
            'status' => 'sending',
            'attempts' => $log->attempts + 1,
            'sent_at' => now(),
        ]);

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'X-CTUT-SOCIAL-SECRET' => $secret,
            ])
                ->timeout(60)
                ->post($webhookUrl, [
                    'log_id' => $log->id,
                    'trigger_type' => $log->trigger_type,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'platform' => $log->platform,
                    'payload' => $log->payload,
                    'callback' => [
                        'url' => url('/api/n8n/social/callback'),
                        'secret_header' => 'X-CTUT-SOCIAL-CALLBACK-SECRET',
                    ],
                ]);

            $body = $response->json();

            $log->update([
                'status' => $response->successful() ? 'sent' : 'failed',
                'n8n_response' => is_array($body) ? $body : [
                    'raw' => $response->body(),
                ],
                'error_message' => $response->successful() ? null : $response->body(),
            ]);

            if (!$response->successful()) {
                throw new RuntimeException('n8n trả lỗi: ' . $response->body(), 500);
            }

            return [
                'success' => true,
                'message' => 'Đã gửi webhook sang n8n',
                'data' => $body,
            ];
        } catch (Throwable $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw new RuntimeException('Không thể gửi webhook sang n8n: ' . $e->getMessage(), 500);
        }
    }

    public function updateFromCallback(array $data): array
    {
        $logId = (int) ($data['log_id'] ?? 0);

        $log = SocialAutomationLog::query()->find($logId);

        if (!$log) {
            throw new RuntimeException('Không tìm thấy social automation log', 404);
        }

        $status = $data['status'] ?? 'success';

        if (!in_array($status, ['success', 'failed', 'skipped'], true)) {
            $status = 'success';
        }

        $log->update([
            'status' => $status,
            'platform_response' => $data['platform_response'] ?? $data,
            'error_message' => $data['error_message'] ?? null,
            'completed_at' => now(),
        ]);

        return [
            'id' => $log->id,
            'status' => $log->status,
            'completed_at' => optional($log->completed_at)->format('d/m/Y H:i'),
        ];
    }

    private function buildProductCreatedPayload(Product $product, ?string $caption = null, ?string $style = null): array
    {
        $product->loadMissing([
            'category',
            'images',
            'variants',
        ]);

        $images = $this->productImages($product);
        $image = $images[0] ?? null;
        $productUrl = $this->publicUrl('/product/' . $product->slug);
        $caption = $this->normalizeCaption($caption, $productUrl);

        $minPrice = $product->variants
            ->pluck('price')
            ->filter(fn ($price) => $price !== null)
            ->min();

        $maxPrice = $product->variants
            ->pluck('price')
            ->filter(fn ($price) => $price !== null)
            ->max();

        $availableStock = $product->variants
            ->sum(function ($variant) {
                return max(0, (int) $variant->stock - (int) $variant->reserved_stock);
            });

        return [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'short_description' => $product->short_description ?? null,
                'category' => [
                    'id' => $product->category?->id,
                    'name' => $product->category?->name,
                ],
                'price' => [
                    'min' => $minPrice ? (float) $minPrice : null,
                    'max' => $maxPrice ? (float) $maxPrice : null,
                ],
                'stock' => [
                    'available' => (int) $availableStock,
                    'in_stock' => $availableStock > 0,
                ],
                'variants' => $product->variants
                    ->map(fn ($variant) => [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'price' => (float) $variant->price,
                        'stock' => (int) $variant->stock,
                        'reserved_stock' => (int) $variant->reserved_stock,
                        'available_stock' => max(0, (int) $variant->stock - (int) $variant->reserved_stock),
                    ])
                    ->values()
                    ->toArray(),
                'image' => $image,
                'images' => $images,
                'url' => $productUrl,
            ],
            'caption_template' => [
                'title' => 'Sản phẩm mới tại CTUT Store',
                'hashtags' => [
                    '#CTUTStore',
                    '#CTUT',
                    '#SanPhamMoi',
                ],
            ],
            'caption' => [
                'source' => $caption ? 'admin_approved_ai' : 'template',
                'style' => $style,
                'content' => $caption,
            ],
        ];
    }

    private function firstProductImage(Product $product): ?string
    {
        return $this->productImages($product)[0] ?? null;
    }

    private function productImages(Product $product): array
    {
        return $product->images
            ->sortBy('position')
            ->map(function ($image) {
                $path = $image->image_url
                    ?? $image->url
                    ?? $image->path
                    ?? $image->image
                    ?? null;

                return $this->publicUrl($path);
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    public function publicProductUrl(Product $product): ?string
    {
        return $this->publicUrl('/product/' . $product->slug);
    }

    public function publicPromotionUrl(Promotion $promotion): ?string
    {
        return $this->publicUrl('/promotions/' . $promotion->slug);
    }

    private function publicUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        $publicBaseUrl = rtrim((string) config('services.n8n.social_public_url'), '/');

        if ($publicBaseUrl === '') {
            return str_starts_with($path, 'http://') || str_starts_with($path, 'https://')
                ? $path
                : url($path);
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $parsed = parse_url($path);
            $path = ($parsed['path'] ?? '') . (isset($parsed['query']) ? '?' . $parsed['query'] : '');
        }

        return $publicBaseUrl . '/' . ltrim($path, '/');
    }

    private function normalizeCaption(?string $caption, ?string $productUrl): ?string
    {
        if (!$caption) {
            return null;
        }

        $caption = trim($caption);

        if ($productUrl) {
            $caption = str_replace('[link sản phẩm]', $productUrl, $caption);
        }

        return $caption;
    }

    public function createPromotionCreatedLog(Promotion $promotion, ?string $caption = null, ?string $style = null): SocialAutomationLog
    {
        $payload = $this->buildPromotionCreatedPayload($promotion, $caption, $style);

        return SocialAutomationLog::create([
            'trigger_type' => 'promotion_created',
            'entity_type' => 'promotion',
            'entity_id' => $promotion->id,
            'platform' => 'facebook',
            'status' => 'pending',
            'payload' => $payload,
        ]);
    }

    private function buildPromotionCreatedPayload(Promotion $promotion, ?string $caption = null, ?string $style = null): array
    {
        $promotion->loadMissing([
            'items.product',
            'items.productVariant',
        ]);

        $products = $promotion->items
            ->take(8)
            ->map(function ($item) {
                $product = $item->product;
                $variant = $item->productVariant;

                if (!$product) {
                    return null;
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'variant' => $variant ? [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'size' => $variant->size,
                        'color' => $variant->color,
                        'price' => $variant->price ? (float) $variant->price : null,
                    ] : null,
                    'discount_type' => $item->discount_type ?? $promotion->discount_type,
                    'discount_value' => $item->discount_value ?? $promotion->discount_value,
                    'limit_quantity' => $item->limit_quantity,
                    'sold_quantity' => $item->sold_quantity,
                    'reserved_quantity' => $item->reserved_quantity,
                ];
            })
            ->filter()
            ->values()
            ->toArray();

        $promotionUrl = $this->publicPromotionUrl($promotion);
        $caption = $this->normalizeCaption($caption, $promotionUrl);

        return [
            'promotion' => [
                'id' => $promotion->id,
                'title' => $promotion->title,
                'slug' => $promotion->slug,
                'description' => $promotion->description,
                'banner' => $this->normalizePublicUrl($promotion->banner ?? null),
                'thumbnail' => $this->normalizePublicUrl($promotion->thumbnail ?? null),
                'image' => $this->normalizePublicUrl($promotion->banner ?? null)
                    ?: $this->normalizePublicUrl($promotion->thumbnail ?? null),
                'images' => array_values(array_filter(array_unique([
                    $this->normalizePublicUrl($promotion->banner ?? null),
                    $this->normalizePublicUrl($promotion->thumbnail ?? null),
                ]))),
                'discount_type' => $promotion->discount_type,
                'discount_value' => $promotion->discount_value ? (float) $promotion->discount_value : null,
                'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
                'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
                'status' => $promotion->status,
                'is_active' => (bool) $promotion->is_active,
                'url' => $promotionUrl,
                'products' => $products,
                'products_count' => $promotion->items->count(),
            ],
            'caption_template' => [
                'title' => 'Khuyến mãi mới tại CTUT Store',
                'hashtags' => [
                    '#CTUTStore',
                    '#CTUT',
                    '#KhuyenMai',
                ],
            ],
            'caption' => [
                'source' => $caption ? 'admin_approved_ai' : 'template',
                'style' => $style,
                'content' => $caption,
            ],
        ];
    }

    private function normalizePublicUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return $this->publicUrl($path);
    }
}
