<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FaqService;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function __construct(
        protected FaqService $faqService
    ) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách FAQ thành công',
            'data' => $this->faqService->list($request->all()),
        ]);
    }

    public function categories()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh mục FAQ thành công',
            'data' => $this->faqService->categories(),
        ]);
    }
}