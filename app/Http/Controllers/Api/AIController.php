<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class AIController extends Controller
{
    public function __construct(
        protected AIService $aiService
    ){}

    public function chat(Request $request)
    {
        try {
            $data = $request->validate([
                'message' => 'required|string|max:2000',
            ], [
                'message.required' => 'Vui lòng nhập nội dung cần hỏi',
                'message.string' => 'Nội dung câu hỏi không hợp lệ',
                'message.max' => 'Nội dung câu hỏi không được vượt quá 2000 ký tự',
            ]);

            $result = $this->aiService->chat(
                $request->user(),
                $data['message']
            );

            return response()->json([
                'success' => true,
                'message' => 'AI phản hồi thành công',
                'data' => $result,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu chat không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('AI chat database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('AI chat system error', [
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
            $history = $this->aiService->history(
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy lịch sử chat thành công',
                'data' => $history->items(),
                'meta' => [
                    'current_page' => $history->currentPage(),
                    'last_page' => $history->lastPage(),
                    'per_page' => $history->perPage(),
                    'total' => $history->total(),
                ],
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('AI chat history database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('AI chat history system error', [
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