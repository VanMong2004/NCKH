<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function send(string $event, array $data = []): void
    {
        $url = config('services.n8n.webhook');

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
                ->retry(2, 200)
                ->withHeaders([
                    'X-LARAVEL-SECRET' => config('services.n8n.secret'),
                ])
                ->post($url, $payload);

            Log::info('Webhook sent', [
                'url' => $url,
                'event' => $event,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

        } catch (\Throwable $e) {
            Log::error('Webhook failed', [
                'url' => $url,
                'event' => $event,
                'error' => $e->getMessage(),
            ]);
        }
    }
}