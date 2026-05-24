<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AboutService;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Throwable;

class AboutController extends Controller
{
    public function __construct(
        protected AboutService $aboutService
    ) {}

    public function show()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy thông tin giới thiệu thành công',
                'data' => $this->aboutService->show(),
            ]);

        } catch (QueryException $e) {
            Log::error('Get about info database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get about info system error', [
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