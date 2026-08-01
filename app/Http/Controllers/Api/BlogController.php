<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BlogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
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
                'keyword' => 'nullable|string|max:255',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ]);

            $blogs = $this->blogService->list($filters);

            return response()->json([
                'success' => true,
                'message' => 'Lay danh sach tin tuc thanh cong',
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
                'message' => 'Bo loc tin tuc khong hop le',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (Throwable $e) {
            Log::error('Get blog list error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Da xay ra loi he thong',
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
                'message' => 'Lay chi tiet tin tuc thanh cong',
                'data' => $this->blogService->show($data['identifier']),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Duong dan bai viet khong hop le',
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
                'message' => 'Da xay ra loi he thong',
                'data' => null,
            ], 500);
        }
    }
}
