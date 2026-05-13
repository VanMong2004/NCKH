<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\UserCampaignApprovalService;

class UserCampaignApprovalController extends Controller
{
    protected $service;

    public function __construct(UserCampaignApprovalService $service)
    {
        $this->service = $service;
    }

    public function approve(Request $request, $id)
    {
        $request->validate([
            'approved_quantity' => 'required|integer|min:1'
        ]);

        $result = $this->service->approve(
            $id,
            $request->approved_quantity
        );

        return response()->json($result);
    }

    public function reject($id)
    {
        $result = $this->service->reject($id);

        return response()->json($result);
    }
}