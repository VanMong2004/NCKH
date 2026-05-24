<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class BlogController extends Controller
{
    public function __construct(
        protected BlogService $blogService
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'category' => 'nullable|string|max:100',
                'keyword' => 'nullable|string|max:255',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ]);

            $blogs = $this->blogService->list($filters);

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

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc blog không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (Throwable $e) {
            Log::error('Get blog list error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show(Request $request, $identifier)
    {
        try {
            $request->merge([
                'identifier' => $identifier,
            ]);

            $data = $request->validate([
                'identifier' => 'required|string|max:255',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết blog thành công',
                'data' => $this->blogService->show($data['identifier']),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Blog không hợp lệ',
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 404);

        } catch (Throwable $e) {
            Log::error('Get blog detail error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function categories()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy danh mục blog thành công',
                'data' => $this->blogService->categories(),
            ]);

        } catch (Throwable $e) {
            Log::error('Get blog categories error', [
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