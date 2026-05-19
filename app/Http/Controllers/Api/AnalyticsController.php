<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\AnalyticsExport;
use Maatwebsite\Excel\Facades\Excel;

class AnalyticsController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ){}

    public function overview(
        Request $request
    ){

        return response()->json([

            'success'=>true,

            'message'=>
            'Overview thành công',

            'data'=>
            $this->analyticsService
                ->overview(
                    $request->user()
                )
        ]);
    }

    public function topProducts(Request $request)
    {
        return response()->json([

            'success'=>true,

            'message'=>
            'Top products',

            'data'=>
            $this->analyticsService->topProducts(
                $request->user()
            )
        ]);
    }

    public function salesChart(
        Request $request
    ){

        return response()->json([

            'success'=>true,

            'message'=>
            'Sales chart',

            'data'=>
            $this->analyticsService
                ->salesChart(
                    $request->user(),
                    $request->days ?? 7
                )
        ]);
    }

    public function exportPdf(Request $request)
    {
        $data =
            $this->analyticsService
                ->exportData(
                    $request->user()
                );

        $pdf = Pdf::loadView(
            'pdf.analytics',
            $data
        );

        return $pdf->download(
            'analytics-report.pdf'
        );
    }

    public function exportExcel(Request $request)
    {
        $data =
            $this->analyticsService
                ->exportData(
                    $request->user()
                );

        return Excel::download(
            new AnalyticsExport(
                $data
            ),
            'analytics.xlsx'
        );
    }
}