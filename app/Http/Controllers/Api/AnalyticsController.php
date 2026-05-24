<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\AnalyticsExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class AnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    public function overview(Request $request)
    {
        try {
            $data = $this->analyticsService->overview($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Overview thành công',
                'data' => $data,
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Analytics overview error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function topProducts(Request $request)
    {
        try {
            $data = $this->analyticsService->topProducts($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Top products',
                'data' => $data,
            ]);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Analytics top products error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function salesChart(Request $request)
    {
        try {
            $data = $request->validate([
                'days' => 'nullable|integer|min:1|max:365',
            ], [
                'days.integer' => 'Số ngày không hợp lệ',
                'days.min' => 'Số ngày phải lớn hơn hoặc bằng 1',
                'days.max' => 'Số ngày không được vượt quá 365',
            ]);

            $chart = $this->analyticsService->salesChart(
                $request->user(),
                $data['days'] ?? 7
            );

            return response()->json([
                'success' => true,
                'message' => 'Sales chart',
                'data' => $chart,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thống kê không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Analytics sales chart error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function exportPdf(Request $request)
    {
        try {
            $data = $this->analyticsService->exportData(
                $request->user()
            );

            $pdf = Pdf::loadView(
                'pdf.analytics',
                $data
            );

            return $pdf->download('analytics-report.pdf');

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Export analytics PDF error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function exportExcel(Request $request)
    {
        try {
            $data = $this->analyticsService->exportData(
                $request->user()
            );

            return Excel::download(
                new AnalyticsExport($data),
                'analytics.xlsx'
            );

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (Throwable $e) {
            Log::error('Export analytics Excel error', [
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