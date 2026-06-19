<?php

namespace App\Services\Social;

use App\Models\Product;
use App\Models\SocialAutomationLog;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class N8nSocialAutomationService
{
    public function createProductCreatedLog(Product $product): SocialAutomationLog
    {
        $payload = $this->buildProductCreatedPayload($product);

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

    private function buildProductCreatedPayload(Product $product): array
    {
        $product->loadMissing([
            'category',
            'images',
            'variants',
        ]);

        $image = $this->firstProductImage($product);

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
                'url' => url('/shop/' . $product->slug),
            ],
            'caption_template' => [
                'title' => 'Sản phẩm mới tại CTUT Store',
                'hashtags' => [
                    '#CTUTStore',
                    '#CTUT',
                    '#SanPhamMoi',
                ],
            ],
        ];
    }

    private function firstProductImage(Product $product): ?string
    {
        $image = $product->images->first();

        if (!$image) {
            return null;
        }

        $path = $image->image_url
            ?? $image->url
            ?? $image->path
            ?? $image->image
            ?? null;

        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return url($path);
    }
}