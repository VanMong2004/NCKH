<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HomeService;
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

            $result = $this->homeService
                ->getHomeData();

            return response()->json($result);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy dữ liệu home',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }
}