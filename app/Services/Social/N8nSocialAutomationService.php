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

        $productUrl = $this->publicProductUrl($product);
        $productImages = $this->productImages($product);
        $productImage = $productImages[0] ?? null;
        $captionSource = $caption ? 'admin_approved_ai' : 'template';
        $caption = $this->normalizeCaption($caption, $productUrl, 'Xem sản phẩm');

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
            'public_url' => $productUrl,
            'image_url' => $productImage,
            'images' => $productImages,
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
                'url' => $productUrl,
                'public_url' => $productUrl,
                'image' => $productImage,
                'image_url' => $productImage,
                'thumbnail' => $productImage,
                'images' => $productImages,
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
                'source' => $captionSource,
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

                return $this->resolvePublicImageUrl($path);
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
        $path = $this->sanitizeSocialText($path);

        if (!$path) {
            return null;
        }

        if ($this->isHttpUrl($path)) {
            $parsed = parse_url($path);
            $path = ($parsed['path'] ?? '') . (isset($parsed['query']) ? '?' . $parsed['query'] : '');
        }

        if (str_starts_with($path, 'public/')) {
            $path = substr($path, strlen('public/'));
        }

        return $this->publicBaseUrl() . '/' . ltrim($path, '/');
    }

    private function normalizeCaption(?string $caption, ?string $url = null, string $linkLabel = 'Xem chi tiết'): ?string
    {
        $caption = $this->sanitizeSocialText($caption) ?: '';

        if ($caption === '' && $url) {
            return "{$linkLabel}: {$url}";
        }

        if ($url) {
            $caption = str_replace($this->linkPlaceholders(), $url, $caption);
        }

        $caption = preg_replace('/\s+([,.!?:;])/u', '$1', (string) $caption);
        $caption = preg_replace('/\n{3,}/u', "\n\n", (string) $caption);
        $caption = preg_replace('/[ \t]{2,}/u', ' ', (string) $caption);
        $caption = trim((string) $caption);

        if ($url && !$this->captionContainsUrl($caption, $url)) {
            $caption .= "\n\n{$linkLabel}: {$url}";
        }

        return $caption !== '' ? $caption : null;
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
            'items.product.images',
            'items.productVariant',
        ]);

        $promotionUrl = $this->publicPromotionUrl($promotion);
        $promotionImages = $this->promotionImages($promotion);
        $promotionImage = $promotionImages[0] ?? null;
        $captionSource = $caption ? 'admin_approved_ai' : 'template';
        $caption = $this->normalizeCaption($caption, $promotionUrl, 'Xem khuyến mãi');

        $products = $promotion->items
            ->take(8)
            ->map(function ($item) {
                $product = $item->product;
                $variant = $item->productVariant;

                if (!$product) {
                    return null;
                }

                $productUrl = $this->publicProductUrl($product);
                $productImages = $this->productImages($product);
                $productImage = $productImages[0] ?? null;

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'url' => $productUrl,
                    'public_url' => $productUrl,
                    'image' => $productImage,
                    'image_url' => $productImage,
                    'images' => $productImages,
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

        return [
            'public_url' => $promotionUrl,
            'image_url' => $promotionImage,
            'images' => $promotionImages,
            'promotion' => [
                'id' => $promotion->id,
                'title' => $promotion->title,
                'slug' => $promotion->slug,
                'description' => $promotion->description,
                'url' => $promotionUrl,
                'public_url' => $promotionUrl,
                'banner' => $this->resolvePublicImageUrl($promotion->banner),
                'thumbnail' => $this->resolvePublicImageUrl($promotion->thumbnail),
                'image' => $promotionImage,
                'image_url' => $promotionImage,
                'images' => $promotionImages,
                'discount_type' => $promotion->discount_type,
                'discount_value' => $promotion->discount_value ? (float) $promotion->discount_value : null,
                'start_date' => optional($promotion->start_date)->format('d/m/Y H:i'),
                'end_date' => optional($promotion->end_date)->format('d/m/Y H:i'),
                'status' => $promotion->status,
                'is_active' => (bool) $promotion->is_active,
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
                'source' => $captionSource,
                'style' => $style,
                'content' => $caption,
            ],
        ];
    }

    private function resolvePublicImageUrl(?string $path): ?string
    {
        $path = $this->sanitizeSocialText($path);

        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'public/')) {
            $path = substr($path, strlen('public/'));
        }

        $isHttpUrl = $this->isHttpUrl($path);
        $publicUrl = $this->publicUrl($path);

        if (!$publicUrl) {
            return null;
        }

        if ($this->publicAssetExists($publicUrl)) {
            return $publicUrl;
        }

        if ($isHttpUrl && !$this->isLocalLikeUrl($path)) {
            return $path;
        }

        return null;
    }

    private function publicAssetExists(string $url): bool
    {
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? null;

        if (!$path) {
            return false;
        }

        return is_file(public_path(ltrim($path, '/')));
    }

    private function promotionImages(Promotion $promotion): array
    {
        $images = [
            $this->resolvePublicImageUrl($promotion->banner),
            $this->resolvePublicImageUrl($promotion->thumbnail),
        ];

        foreach ($promotion->items as $item) {
            if ($item->product) {
                $images = array_merge($images, $this->productImages($item->product));
            }
        }

        return collect($images)
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    private function publicBaseUrl(): string
    {
        $baseUrl = trim((string) config('services.n8n.social_public_url'));

        if ($baseUrl === '') {
            $baseUrl = trim((string) config('app.url'));
        }

        if ($baseUrl === '') {
            $baseUrl = url('/');
        }

        return rtrim($baseUrl, '/');
    }

    private function isHttpUrl(string $value): bool
    {
        return str_starts_with($value, 'http://') || str_starts_with($value, 'https://');
    }

    private function isLocalLikeUrl(string $url): bool
    {
        if (!$this->isHttpUrl($url)) {
            return true;
        }

        $host = parse_url($url, PHP_URL_HOST);

        if (!$host) {
            return true;
        }

        $localHosts = array_filter([
            'localhost',
            '127.0.0.1',
            '::1',
            parse_url((string) config('app.url'), PHP_URL_HOST),
            parse_url($this->publicBaseUrl(), PHP_URL_HOST),
        ]);

        return in_array($host, $localHosts, true);
    }

    private function linkPlaceholders(): array
    {
        return [
            '[link sản phẩm]',
            '[link khuyến mãi]',
            '[link]',
            '[link sản phẩm]',
            '[link khuyến mãi]',
        ];
    }

    private function captionContainsUrl(string $caption, string $url): bool
    {
        return str_contains($caption, $url)
            || preg_match('/https?:\/\/[^\s]+/iu', $caption) === 1;
    }

    private function sanitizeSocialText(?string $value): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $value = preg_replace('/\[(.*?)\]\((https?:\/\/[^\s]+)\)/u', '$1: $2', $value);
        $value = preg_replace('/[*_`#>~]+/u', '', $value);
        $value = preg_replace('/\n{3,}/u', "\n\n", $value);

        return trim($value);
    }
}
