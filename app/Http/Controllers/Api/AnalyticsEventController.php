<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics\AnalyticsEventService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class AnalyticsEventController extends Controller
{
    public function __construct(
        protected AnalyticsEventService $service
    ) {}

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'event_type' => 'required|in:page_view,product_view',
                'visitor_id' => 'required|string|max:100',
                'session_id' => 'required|string|max:100',
                'entity_type' => 'nullable|string|max:50',
                'entity_id' => 'nullable|integer|min:1',
                'product_id' => 'nullable|integer|exists:products,id',
                'url' => 'nullable|string|max:1000',
                'referrer' => 'nullable|string|max:1000',
                'metadata' => 'nullable|array',
            ]);

            $this->service->trackFromRequest($request, $data['event_type'], $data);

            return response()->json([
                'success' => true,
                'message' => 'Ghi nhận hành vi thành công',
                'data' => null,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu hành vi không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);
        } catch (Throwable $e) {
            Log::warning('Store analytics event error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Không thể ghi nhận hành vi',
                'data' => null,
            ], 500);
        }
    }
}
