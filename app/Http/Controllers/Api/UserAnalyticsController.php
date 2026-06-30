<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UserAnalyticsService;
use App\Exports\UserAnalyticsExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class UserAnalyticsController extends Controller
{
    public function __construct(
        protected UserAnalyticsService $service
    ) {}

    public function overview(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê cá nhân thành công',
                'data' => $this->service->overview($request->user()),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'User analytics overview error');
        }
    }

    public function orders(Request $request)
    {
        try {
            $data = $request->validate([
                'months' => 'nullable|integer|min:1|max:24',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê đơn hàng cá nhân thành công',
                'data' => $this->service->orders($request->user(), $data['months'] ?? 12),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'User order analytics error');
        }
    }

    public function spending(Request $request)
    {
        try {
            $data = $request->validate([
                'months' => 'nullable|integer|min:1|max:24',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê chi tiêu cá nhân thành công',
                'data' => $this->service->spending($request->user(), $data['months'] ?? 12),
            ]);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'User spending analytics error');
        }
    }

    public function interests(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê sản phẩm quan tâm thành công',
                'data' => $this->service->interests($request->user()),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'User interest analytics error');
        }
    }

    public function orderTracking(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy trạng thái đơn hàng đang theo dõi thành công',
                'data' => $this->service->orderTracking($request->user()),
            ]);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'User order tracking analytics error');
        }
    }

    public function exportPdf(Request $request)
    {
        try {
            $data = $this->service->exportData($request->user());

            $pdf = Pdf::loadView('pdf.user-analytics', $data);

            return $pdf->download('user-analytics-report.pdf');
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Export user analytics PDF error');
        }
    }

    public function exportExcel(Request $request)
    {
        try {
            $data = $this->service->exportData($request->user());

            return Excel::download(
                new UserAnalyticsExport($data),
                'user-analytics.xlsx'
            );
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Export user analytics Excel error');
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
        ], $this->httpStatus($e));
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

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
