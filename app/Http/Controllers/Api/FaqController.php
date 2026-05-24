<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FaqService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class FaqController extends Controller
{
    public function __construct(
        protected FaqService $faqService
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'category' => 'nullable|string|max:100',
                'keyword' => 'nullable|string|max:255',
            ], [
                'category.string' => 'Danh mục FAQ không hợp lệ',
                'category.max' => 'Danh mục FAQ không hợp lệ',

                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',
            ]);

            $result = $this->faqService->list($filters);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách FAQ thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc FAQ không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);

        } catch (QueryException $e) {
            Log::error('Get FAQ list database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get FAQ list system error', [
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
            $result = $this->faqService->categories();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh mục FAQ thành công',
                'data' => $result,
            ]);

        } catch (QueryException $e) {
            Log::error('Get FAQ categories database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get FAQ categories system error', [
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