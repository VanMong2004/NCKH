<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    /**
     * Send webhook to n8n
     */
    public function send(string $event, array $data = []): void
    {
        $url = config('services.n8n.webhook');

        // ❌ chưa config
        if (!$url) {
            Log::error('Webhook URL is null. Check config/services.php or .env');
            return;
        }

        try {
            $payload = [
                'event' => $event,
                'data' => $data,
            ];

            $response = Http::timeout(5)
                ->retry(2, 200) // retry 2 lần, mỗi lần cách 200ms
                ->post($url, $payload);

            // 🔥 log success
            Log::info('Webhook sent', [
                'url' => $url,
                'event' => $event,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

        } catch (\Throwable $e) {
            // 🔥 log error
            Log::error('Webhook failed', [
                'url' => $url,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}