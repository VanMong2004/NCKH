<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SystemService;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Throwable;

class SystemController extends Controller
{
    public function __construct(
        protected SystemService $service
    ) {}

    public function state()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy trạng thái hệ thống thành công',
                'data' => $this->service->getState(),
            ]);

        } catch (QueryException $e) {
            Log::error('Get system state database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get system state error', [
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