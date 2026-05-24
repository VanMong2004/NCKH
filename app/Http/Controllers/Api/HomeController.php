<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomeService;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;
use Exception;

class HomeController extends Controller
{
    protected $homeService;

    public function __construct(
        HomeService $homeService
    ) {
        $this->homeService = $homeService;
    }

    public function getHomeData()
    {
        try {
            $result = $this->homeService->getHomeData(
                auth()->user()
            );

            return response()->json($result);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);

        } catch (QueryException $e) {
            Log::error('Get home data database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get home data system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}