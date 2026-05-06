<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\CampaignService;

class CampaignController extends Controller
{
    protected $campaignService;

    public function __construct(CampaignService $campaignService)
    {
        $this->campaignService = $campaignService;
    }

    public function checkout(Request $request)
    {
        try {
            $request->validate([
                'campaign_id' => 'required|exists:campaigns,id',
                'items' => 'required|array|min:1',
                'items.*.campaign_item_id' => 'required|exists:campaign_items,id',
                'items.*.quantity' => 'required|integer|min:1',
            ]);

            $order = $this->campaignService->checkout(
                $request->user()->id,
                $request->all()
            );

            return response()->json([
                'message' => 'Đăng ký campaign thành công',
                'data' => $order
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }
}