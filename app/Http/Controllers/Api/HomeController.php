<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomeService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class HomeController extends Controller
{
    public function __construct(
        protected HomeService $homeService
    ) {}

    /*
    Response:
        "data": {
            "site_content": {
            "site": {},
            "navbar": {},
            "mobile_menu": {},
            "bottom_navigation": {},
            "footer": {},
            "hero_slider": {}
            },
            "featured_products": [],
            "new_products": [],
            "best_selling_products": [],
            "top_rated_products": [],
            "categories": [],
            "cart_count": 0,
            "unread_notifications": 0,
            "news_events": [],
            "trending_keywords": []
    */

    public function getHomeData()
    {
        try {
            $data = $this->homeService->getHomeData(
                auth('sanctum')->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy dữ liệu trang chủ thành công',
                'data' => $data,
            ]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (QueryException $e) {
            Log::error('Get home data database error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        } catch (Throwable $e) {
            Log::error('Get home data system error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function siteContent()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy nội dung site thành công',
                'data' => [
                    'site_content' => $this->homeService->getSiteContent('home'),
                ],
            ]);
        } catch (Throwable $e) {
            Log::error('Get site content error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
