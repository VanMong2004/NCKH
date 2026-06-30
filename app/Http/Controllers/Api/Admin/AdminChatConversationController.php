<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminChatConversationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminChatConversationController extends Controller
{
    public function __construct(
        protected AdminChatConversationService $service
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'keyword' => 'nullable|string|max:255',
                'status' => 'nullable|string|in:active,expired,closed',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
                'sort' => 'nullable|string|in:latest,oldest,most_messages',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:50',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách hội thoại AI thành công',
                'data' => $this->service->list($filters),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat conversations index error');
        }
    }

    public function statistics()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê hội thoại AI thành công',
                'data' => $this->service->statistics(),
            ]);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat conversations statistics error');
        }
    }

    public function show($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết hội thoại AI thành công',
                'data' => $this->service->show((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat conversation show error');
        }
    }

    public function close($id)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Đóng hội thoại AI thành công',
                'data' => $this->service->close((int) $id),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin chat conversation close error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Bộ lọc hội thoại AI không hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
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
