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

            $guestToken = $this->guestToken($request);

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

    public function current(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            $guestToken = $this->guestToken($request);

            return response()->json([
                'success' => true,
                'message' => 'Lấy phiên chat hiện tại thành công',
                'data' => $this->service->currentSession($user, $guestToken),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat current session error');
        }
    }

    public function currentMessages(Request $request)
    {
        try {
            $data = $request->validate([
                'limit' => 'nullable|integer|min:1|max:50',
            ]);

            $user = auth('sanctum')->user();
            $guestToken = $this->guestToken($request);

            return response()->json([
                'success' => true,
                'message' => 'Lấy lịch sử chat hiện tại thành công',
                'data' => $this->service->currentMessages(
                    $user,
                    $guestToken,
                    (int) ($data['limit'] ?? 20)
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat current messages error');
        }
    }

    public function reset(Request $request)
    {
        try {
            $user = auth('sanctum')->user();
            $guestToken = $this->guestToken($request);

            return response()->json([
                'success' => true,
                'message' => 'Tạo hội thoại mới thành công',
                'data' => $this->service->resetSession($user, $guestToken),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat reset session error');
        }
    }

    public function translate(Request $request)
    {
        try {
            $data = $request->validate([
                'text' => 'required|string|max:5000',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dịch nội dung thành công',
                'data' => $this->service->translateToVietnamese($data['text']),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'AI chat translate error');
        }
    }

    public function conversations(Request $request)
    {
        try {
            $user = auth('sanctum')->user();

            $guestToken = $this->guestToken($request);

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

            $guestToken = $this->guestToken($request);

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

    private function guestToken(Request $request): ?string
    {
        return $request->header('X-Guest-Token')
            ?: $request->query('guest_token')
            ?: $request->input('guest_token');
    }

    private function businessError(RuntimeException $e)
    {
        $status = is_int($e->getCode()) && $e->getCode() >= 100 && $e->getCode() <= 599
            ? $e->getCode()
            : 400;

        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], $status);
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
