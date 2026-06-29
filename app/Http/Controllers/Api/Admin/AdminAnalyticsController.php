<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminAnalyticsService;
use App\Exports\AdminAnalyticsExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminAnalyticsController extends Controller
{
    public function __construct(
        protected AdminAnalyticsService $service
    ) {}

    public function overview(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Overview thành công',
                'data' => $this->service->overview($request->user()),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin analytics overview error');
        }
    }

    public function topProducts(Request $request)
    {
        try {
            $data = $request->validate([
                'limit' => 'nullable|integer|min:1|max:20',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Top products',
                'data' => $this->service->topProducts(
                    $request->user(),
                    $data['limit'] ?? 10,
                    $data
                ),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin top products analytics error');
        }
    }

    public function salesChart(Request $request)
    {
        try {
            $data = $request->validate([
                'days' => 'nullable|integer|in:7,30,90,365',
                'group_by' => 'nullable|in:day,week,month,year',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Sales chart',
                'data' => $this->service->salesChart(
                    $request->user(),
                    $data['days'] ?? 7,
                    $data
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin sales chart analytics error');
        }
    }

    public function behaviorOverview(Request $request)
    {
        try {
            $data = $request->validate([
                'days' => 'nullable|integer|min:1|max:365',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Behavior overview',
                'data' => $this->service->behaviorOverview(
                    $request->user(),
                    $data['days'] ?? 30,
                    $data
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin behavior analytics overview error');
        }
    }

    public function behaviorChart(Request $request)
    {
        try {
            $data = $request->validate([
                'days' => 'nullable|integer|in:7,30,90,365',
                'group_by' => 'nullable|in:day,week,month,year',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Behavior chart',
                'data' => $this->service->behaviorChart(
                    $request->user(),
                    $data['days'] ?? 30,
                    $data
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin behavior analytics chart error');
        }
    }

    public function revenueByCategory(Request $request)
    {
        try {
            $data = $request->validate([
                'limit' => 'nullable|integer|min:1|max:20',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Revenue by category',
                'data' => $this->service->revenueByCategory(
                    $request->user(),
                    $data['limit'] ?? 8,
                    $data
                ),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin revenue by category analytics error');
        }
    }

    public function exportPdf(Request $request)
    {
        try {
            $data = $this->service->exportData($request->user());

            $pdf = Pdf::loadView('pdf.admin-analytics', $data);

            return $pdf->download('admin-analytics-report.pdf');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Export admin analytics PDF error');
        }
    }

    public function exportExcel(Request $request)
    {
        try {
            $data = $this->service->exportData($request->user());

            return Excel::download(
                new AdminAnalyticsExport($data),
                'admin-analytics.xlsx'
            );
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Export admin analytics Excel error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Dữ liệu thống kê không hợp lệ',
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
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống',
            'data' => null,
        ], 500);
    }
}
