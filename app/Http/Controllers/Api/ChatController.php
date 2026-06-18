<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Chat\OpenAiHybridRagChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ChatController extends Controller
{
    public function __construct(
        protected OpenAiHybridRagChatService $service
    ) {}

    public function send(Request $request)
    {
        try {
            $data = $request->validate([
                'message' => 'required|string|max:2000',
                'conversation_id' => 'nullable|integer',
                'guest_token' => 'nullable|string|max:100',
            ]);

            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: ($data['guest_token'] ?? null);

            return response()->json([
                'success' => true,
                'message' => 'Trả lời thành công',
                'data' => $this->service->sendMessage(
                    $user,
                    $guestToken,
                    $data['conversation_id'] ?? null,
                    $data['message']
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat send error');
        }
    }

    public function conversations(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách hội thoại thành công',
                'data' => $this->service->conversations($user, $guestToken),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat conversations error');
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $request->header('X-Guest-Token')
                ?: $request->query('guest_token');

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết hội thoại thành công',
                'data' => $this->service->conversationDetail(
                    $user,
                    $guestToken,
                    (int) $id
                ),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat conversation detail error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Dữ liệu chat không hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function businessError(RuntimeException $e)
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], $e->getCode() ?: 400);
    }

    private function systemError(Throwable $e, string $logMessage)
    {
        Log::error($logMessage, [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống',
            'data' => null,
        ], 500);
    }
}