<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SystemService;

class SystemController extends Controller
{
    public function __construct(
        protected SystemService $service
    ) {}

    public function state()
    {
        return response()->json([
            'success'=>true,
            'message'=>'Lấy trạng thái hệ thống thành công',
            'data'=>$this->service->getState()
        ]);
    }
}