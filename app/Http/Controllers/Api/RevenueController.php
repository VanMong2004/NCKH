<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\RevenueService;

class RevenueController extends Controller
{
    protected $revenueService;

    public function __construct(RevenueService $revenueService)
    {
        $this->revenueService = $revenueService;
    }

    public function overview()
    {
        return response()->json(
            $this->revenueService->overview()
        );
    }

    public function daily()
    {
        return response()->json(
            $this->revenueService->daily()
        );
    }

    public function byProduct()
    {
        return response()->json(
            $this->revenueService->byProduct()
        );
    }

    public function chart(Request $request)
    {
        return response()->json(
            $this->revenueService->chart($request)
        );
    }

    public function topProducts(Request $request)
    {
        return response()->json(
            $this->revenueService->topProducts($request)
        );
    }

    public function userAnalytics(Request $request)
    {
        return response()->json(
            $this->revenueService->userAnalytics($request)
        );
    }
}