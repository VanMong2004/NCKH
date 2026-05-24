<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class SearchController extends Controller
{
    public function __construct(
        protected SearchService $searchService
    ){}

    public function suggestions(Request $request)
    {
        try {
            $data = $request->validate([
                'keyword' => 'required|string|max:255',
            ], [
                'keyword.required' => 'Vui lòng nhập từ khóa tìm kiếm',
                'keyword.string' => 'Từ khóa tìm kiếm không hợp lệ',
                'keyword.max' => 'Từ khóa tìm kiếm không được vượt quá 255 ký tự',
            ]);

            $result = $this->searchService->suggestions(
                $request->user(),
                $data['keyword']
            );

            return response()->json([
                'success' => true,
                'message' => 'Gợi ý tìm kiếm',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu tìm kiếm không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Search suggestions database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Search suggestions system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function history(Request $request)
    {
        try {
            $result = $this->searchService->history(
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lịch sử tìm kiếm',
                'data' => $result,
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Search history database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Search history system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function deleteHistory(Request $request, $id)
    {
        try {
            $request->merge([
                'history_id' => $id,
            ]);

            $data = $request->validate([
                'history_id' => 'required|integer|min:1',
            ], [
                'history_id.required' => 'Lịch sử tìm kiếm không hợp lệ',
                'history_id.integer' => 'Lịch sử tìm kiếm không hợp lệ',
                'history_id.min' => 'Lịch sử tìm kiếm không hợp lệ',
            ]);

            $this->searchService->deleteHistory(
                $request->user(),
                $data['history_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa lịch sử',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu lịch sử tìm kiếm không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Delete search history database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Delete search history system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function clearHistory(Request $request)
    {
        try {
            $this->searchService->clearHistory(
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa toàn bộ lịch sử',
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Clear search history database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Clear search history system error', [
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