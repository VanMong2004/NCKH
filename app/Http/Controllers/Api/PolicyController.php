<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PolicyService;
use Illuminate\Http\Request;

class PolicyController extends Controller
{
    public function __construct(
        protected PolicyService $policyService
    ) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách chính sách thành công',
            'data' => $this->policyService->list($request->all()),
        ]);
    }

    public function show($slug)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết chính sách thành công',
            'data' => $this->policyService->show($slug),
        ]);
    }
}