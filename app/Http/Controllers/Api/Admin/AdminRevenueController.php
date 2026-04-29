<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class AdminRevenueController extends Controller
{
    private function getDateRange($request)
    {
        $from = $request->from_date ?? now()->subDays(7);
        $to = $request->to_date ?? now();

        return [$from, $to];
    }

    private function getGrouping($from, $to)
    {
        $days = \Carbon\Carbon::parse($from)->diffInDays($to);

        return $days > 30 ? 'month' : 'day';
    }
    public function overview()
    {
        $totalRevenue = Order::where('status', 'completed')->sum('total');

        $totalOrders = Order::where('status', 'completed')->count();

        $avgOrderValue = $totalOrders > 0
            ? $totalRevenue / $totalOrders
            : 0;

        return response()->json([
            'total_revenue' => (float)$totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => (float)$avgOrderValue,
        ]);
    }

    public function daily()
    {
        $data = Order::where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($data);
    }

    public function byProduct()
    {
        $data = OrderItem::select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(price * quantity) as revenue')
            )
            ->whereHas('order', function ($q) {
                $q->where('status', 'completed');
            })
            ->groupBy('product_variant_id')
            ->orderByDesc('revenue')
            ->get();

        return response()->json($data);
    }

    public function chart(Request $request)
    {
        [$from, $to] = $this->getDateRange($request);
        $group = $this->getGrouping($from, $to);

        if ($group === 'month') {
            $format = '%Y-%m';
        } else {
            $format = '%Y-%m-%d';
        }

        $data = Order::where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE_FORMAT(created_at, '$format') as label")
            ->selectRaw("SUM(total) as revenue")
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return response()->json([
            'labels' => $data->pluck('label'),
            'data' => $data->pluck('revenue')->map(fn($v) => (float)$v),
        ]);
    }

    public function topProducts(Request $request)
    {   
        $limit = $request->limit ?? 5;

        $data = OrderItem::select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(price * quantity) as revenue')
            )
            ->whereHas('order', function ($q) {
                $q->where('status', 'completed');
            })
            ->groupBy('product_variant_id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return response()->json($data);
    }
}