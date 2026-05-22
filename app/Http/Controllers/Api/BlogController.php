<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlogService;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function __construct(
        protected BlogService $blogService
    ) {}

    public function index(Request $request)
    {
        $blogs = $this->blogService->list($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách blog thành công',
            'featured_post' => $this->blogService->featured(),
            'data' => $blogs->items(),
            'meta' => [
                'current_page' => $blogs->currentPage(),
                'last_page' => $blogs->lastPage(),
                'per_page' => $blogs->perPage(),
                'total' => $blogs->total(),
            ],
        ]);
    }

    public function categories()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy danh mục blog thành công',
            'data' => $this->blogService->categories(),
        ]);
    }
}