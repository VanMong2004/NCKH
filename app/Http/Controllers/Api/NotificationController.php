<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function index(Request $request)
    {
        try {
            $filters = $request->validate([
                'type' => 'nullable|string|max:50',
                'is_read' => 'nullable',
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1',
            ], [
                'type.string' => 'Loại thông báo không hợp lệ',
                'type.max' => 'Loại thông báo không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số thông báo mỗi trang không hợp lệ',
                'per_page.min' => 'Số thông báo mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $notifications = $this->notificationService->list(
                $request->user(),
                $filters
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách thông báo thành công',
                'data' => $notifications->items(),
                'meta' => [
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bộ lọc thông báo không hợp lệ',
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
            Log::error('Get notifications database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get notifications system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $request->merge([
                'notification_id' => $id,
            ]);

            $data = $request->validate([
                'notification_id' => 'required|integer|min:1',
            ], [
                'notification_id.required' => 'Thông báo không hợp lệ',
                'notification_id.integer' => 'Thông báo không hợp lệ',
                'notification_id.min' => 'Thông báo không hợp lệ',
            ]);

            $notification = $this->notificationService->show(
                $request->user(),
                $data['notification_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết thông báo thành công',
                'data' => $notification,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thông báo không hợp lệ',
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
            Log::error('Get notification detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get notification detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function unreadCount(Request $request)
    {        
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy số thông báo chưa đọc thành công',
                'data' => [
                    'unread_count' => $this->notificationService->unreadCount(
                        $request->user()
                    ),
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lấy số thông báo chưa đọc không thành công',
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
            Log::error('Get notification detail database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get notification detail system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function markRead(Request $request, $id)
    {
        try {
            $request->merge([
                'notification_id' => $id,
            ]);

            $data = $request->validate([
                'notification_id' => 'required|integer|min:1',
            ], [
                'notification_id.required' => 'Thông báo không hợp lệ',
                'notification_id.integer' => 'Thông báo không hợp lệ',
                'notification_id.min' => 'Thông báo không hợp lệ',
            ]);

            $notification = $this->notificationService->markRead(
                $request->user(),
                $data['notification_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu thông báo đã đọc',
                'data' => $notification,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thông báo không hợp lệ',
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
            Log::error('Mark notification read database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Mark notification read system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function markAllRead(Request $request)
    {
        try {
            $this->notificationService->markAllRead(
                $request->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Đã đánh dấu tất cả thông báo đã đọc',
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Mark all notifications read database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Mark all notifications read system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // API này chỉ dành cho admin hoặc hệ thống tạo notification, không phải người dùng cuối
    public function create(Request $request)
    {
        try {
            if (
                !hash_equals(
                    (string) config('services.n8n.secret'),
                    (string) $request->header('X-N8N-SECRET')
                )
            ) {
                return response()->json([
                    'message' => 'Unauthorized webhook',
                ], 401);
            }

            $data = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'type' => 'required|string|max:100',
                'title' => 'required|string|max:255',
                'message' => 'required|string|max:1000',
                'icon' => 'nullable|string|max:50',
                'color' => 'nullable|string|max:30',
                'action_url' => 'nullable|string|max:500',
                'meta' => 'nullable|array',
            ], [
                'user_id.required' => 'Vui lòng cung cấp người nhận thông báo',
                'user_id.integer' => 'Người nhận thông báo không hợp lệ',
                'user_id.exists' => 'Người nhận thông báo không tồn tại',

                'type.required' => 'Vui lòng cung cấp loại thông báo',
                'title.required' => 'Vui lòng cung cấp tiêu đề thông báo',
                'message.required' => 'Vui lòng cung cấp nội dung thông báo',
            ]);

            $notification = $this->notificationService->createForUser(
                $data['user_id'],
                $data['type'],
                $data['title'],
                $data['message'],
                $data['action_url'] ?? null,
                $data['meta'] ?? null,
                $data['icon'] ?? null,
                $data['color'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Tạo notification thành công',
                'data' => $notification,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu notification không hợp lệ',
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
            Log::error('Create notification database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Create notification system error', [
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