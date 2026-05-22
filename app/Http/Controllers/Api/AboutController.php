<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AboutService;

class AboutController extends Controller
{
    public function __construct(
        protected AboutService $aboutService
    ) {}

    public function show()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin giới thiệu thành công',
            'data' => $this->aboutService->show(),
        ]);
    }
}