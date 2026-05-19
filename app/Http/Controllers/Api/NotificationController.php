<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only([
            'type',
            'is_read',
            'per_page',
            'page',
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
    }

    public function show(Request $request, $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết thông báo thành công',
            'data' => $this->notificationService->show(
                $request->user(),
                $id
            ),
        ]);
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy số thông báo chưa đọc thành công',
            'data' => [
                'unread_count' => $this->notificationService->unreadCount(
                    $request->user()
                ),
            ],
        ]);
    }

    public function markRead(Request $request, $id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu thông báo đã đọc',
            'data' => $this->notificationService->markRead(
                $request->user(),
                $id
            ),
        ]);
    }

    public function markAllRead(Request $request)
    {
        $this->notificationService->markAllRead(
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu tất cả thông báo đã đọc',
        ]);
    }
}