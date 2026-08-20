<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    public function isEnabledForGuestCheckout(?string $paymentMethod): bool
    {
        if (!config('guest_checkout.turnstile_enabled', false)) {
            return false;
        }

        $siteKey = trim((string) config('services.turnstile.site_key', ''));
        $secretKey = trim((string) config('services.turnstile.secret_key', ''));
        $paymentMethods = (array) config('guest_checkout.turnstile_payment_methods', ['mock_bank']);

        return $siteKey !== ''
            && $secretKey !== ''
            && in_array((string) $paymentMethod, $paymentMethods, true);
    }

    public function verifyToken(string $token, ?string $ip = null): array
    {
        $secretKey = trim((string) config('services.turnstile.secret_key', ''));
        $verifyUrl = trim((string) config('services.turnstile.verify_url', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'));

        if ($secretKey === '' || $verifyUrl === '') {
            return [
                'success' => false,
                'error_codes' => ['turnstile_not_configured'],
            ];
        }

        $payload = [
            'secret' => $secretKey,
            'response' => $token,
        ];

        if (!empty($ip)) {
            $payload['remoteip'] = $ip;
        }

        $response = Http::asForm()
            ->timeout(10)
            ->post($verifyUrl, $payload);

        if (!$response->successful()) {
            return [
                'success' => false,
                'error_codes' => ['turnstile_http_failed'],
            ];
        }

        $data = $response->json();

        return [
            'success' => (bool) ($data['success'] ?? false),
            'error_codes' => array_values((array) ($data['error-codes'] ?? [])),
            'raw' => $data,
        ];
    }
}
