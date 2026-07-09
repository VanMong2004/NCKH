<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return $this->limitPerMinute(120, $this->userOrIpKey($request), 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('auth', function (Request $request) {
            $email = (string) $request->input('email', '');

            return $this->limitPerMinute(5, $request->ip() . '|' . strtolower($email), 'Bạn đăng nhập quá nhiều lần, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('contact', function (Request $request) {
            $email = (string) $request->input('email', '');

            return $this->limitPerMinutes(3, 10, $request->ip() . '|' . strtolower($email), 'Bạn đã gửi liên hệ quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('checkout', function (Request $request) {
            return $this->limitPerMinute(10, $this->userOrIpKey($request), 'Bạn thao tác đặt hàng quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('chatbot', function (Request $request) {
            return $this->limitPerMinute(10, $this->userGuestOrIpKey($request), 'Bạn đang gửi tin nhắn quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('admin', function (Request $request) {
            return $this->limitPerMinute(120, $request->user()?->id ? 'admin:' . $request->user()->id : $request->ip(), 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('upload', function (Request $request) {
            return $this->limitPerMinutes(5, 10, $request->user()?->id ? 'admin:' . $request->user()->id : $request->ip(), 'Bạn upload quá nhanh, vui lòng thử lại sau ít phút.');
        });

        RateLimiter::for('webhook', function (Request $request) {
            return $this->limitPerMinute(300, $request->ip(), 'Webhook gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.');
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    private function limitPerMinute(int $maxAttempts, string $key, string $message): Limit
    {
        return Limit::perMinute($maxAttempts)
            ->by($key)
            ->response(fn (Request $request) => $this->rateLimitResponse($request, $message));
    }

    private function limitPerMinutes(int $maxAttempts, int $decayMinutes, string $key, string $message): Limit
    {
        return Limit::perMinutes($decayMinutes, $maxAttempts)
            ->by($key)
            ->response(fn (Request $request) => $this->rateLimitResponse($request, $message));
    }

    private function rateLimitResponse(Request $request, string $message)
    {
        $this->recordRateLimitViolation($request);

        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => [
                'rate_limit' => ['Vui lòng chờ rồi thử lại.'],
            ],
            'data' => null,
        ], 429);
    }

    private function recordRateLimitViolation(Request $request): void
    {
        $ip = (string) $request->ip();

        if ($ip === '') {
            return;
        }

        $key = 'rate_limit:violations:' . sha1($ip);
        $blockKey = 'rate_limit:blocked:' . sha1($ip);
        $violations = Cache::increment($key);

        if ($violations === 1) {
            Cache::put($key, 1, now()->addMinutes(10));
        }

        if ($violations >= 20) {
            Cache::put($blockKey, true, now()->addMinutes(10));
        }
    }

    private function userOrIpKey(Request $request): string
    {
        return $request->user()?->id ? 'user:' . $request->user()->id : 'ip:' . $request->ip();
    }

    private function userGuestOrIpKey(Request $request): string
    {
        if ($request->user()?->id) {
            return 'user:' . $request->user()->id;
        }

        $guestToken = (string) $request->header('X-Guest-Token', '');

        return $guestToken !== '' ? 'guest:' . sha1($guestToken) : 'ip:' . $request->ip();
    }
}
