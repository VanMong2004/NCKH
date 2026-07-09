<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class BlockRateLimitedIp
{
    public function handle(Request $request, Closure $next): Response
    {
        $ip = (string) $request->ip();

        if ($ip !== '' && Cache::has('rate_limit:blocked:' . sha1($ip))) {
            return response()->json([
                'success' => false,
                'message' => 'Địa chỉ truy cập của bạn đang bị tạm giới hạn do gửi quá nhiều yêu cầu.',
                'errors' => [
                    'rate_limit' => ['Vui lòng chờ rồi thử lại.'],
                ],
                'data' => null,
            ], 429);
        }

        return $next($request);
    }
}
