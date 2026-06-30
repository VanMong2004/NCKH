<?php

namespace App\Http\Controllers\Api\N8n;

use App\Http\Controllers\Controller;
use App\Services\Social\N8nSocialAutomationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class N8nSocialCallbackController extends Controller
{
    public function __construct(
        protected N8nSocialAutomationService $service
    ) {}

    public function handle(Request $request)
    {
        try {
            $this->verifySecret($request);

            $data = $request->validate([
                'log_id' => 'required|integer',
                'status' => 'required|string|in:success,failed,skipped',
                'platform_response' => 'nullable|array',
                'error_message' => 'nullable|string',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật trạng thái social automation thành công',
                'data' => $this->service->updateFromCallback($data),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu callback không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            Log::error('N8N social callback error', [
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

    private function verifySecret(Request $request): void
    {
        $expectedSecret = config('services.n8n.social_callback_secret');

        if (!$expectedSecret) {
            throw new RuntimeException('Chưa cấu hình N8N_SOCIAL_CALLBACK_SECRET', 500);
        }

        $givenSecret = $request->header('X-CTUT-SOCIAL-CALLBACK-SECRET')
            ?: $request->query('token');

        if (!$givenSecret || !hash_equals($expectedSecret, (string) $givenSecret)) {
            throw new RuntimeException('Không có quyền callback social automation', 403);
        }
    }
    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
