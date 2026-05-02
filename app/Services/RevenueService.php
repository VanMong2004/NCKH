<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RevenueService
{
    private function getDateRange($request)
    {
        $from = $request->from_date ?? now()->subDays(7);
        $to = $request->to_date ?? now();

        return [$from, $to];
    }

    private function getGrouping($from, $to)
    {
        $days = Carbon::parse($from)->diffInDays($to);
        return $days > 30 ? 'month' : 'day';
    }

    // 🔥 OVERVIEW
    public function overview()
    {
        $totalRevenue = Order::where('status', 'completed')->sum('total');
        $totalOrders = Order::where('status', 'completed')->count();

        return [
            'total_revenue' => (float)$totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => $totalOrders > 0
                ? (float)($totalRevenue / $totalOrders)
                : 0,
        ];
    }

    // 🔥 DAILY
    public function daily()
    {
        return Order::where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();
    }

    // 🔥 BY PRODUCT
    public function byProduct()
    {
        return OrderItem::select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(price * quantity) as revenue')
            )
            ->whereHas('order', fn($q) => $q->where('status', 'completed'))
            ->groupBy('product_variant_id')
            ->orderByDesc('revenue')
            ->get();
    }

    // 🔥 CHART
    public function chart($request)
    {
        [$from, $to] = $this->getDateRange($request);
        $group = $this->getGrouping($from, $to);

        $format = $group === 'month' ? '%Y-%m' : '%Y-%m-%d';

        $data = Order::where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE_FORMAT(created_at, '$format') as label")
            ->selectRaw("SUM(total) as revenue")
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return [
            'labels' => $data->pluck('label'),
            'data' => $data->pluck('revenue')->map(fn($v) => (float)$v),
        ];
    }

    // 🔥 TOP PRODUCTS
    public function topProducts($request)
    {
        $limit = $request->limit ?? 5;

        return OrderItem::select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_sold'),
                DB::raw('SUM(price * quantity) as revenue')
            )
            ->whereHas('order', fn($q) => $q->where('status', 'completed'))
            ->groupBy('product_variant_id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();
    }

    // 🔥 USER ANALYTICS
    public function userAnalytics($request)
    {
        $userId = $request->user()->id;
        [$from, $to] = $this->getDateRange($request);

        $orders = Order::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to]);

        $chart = Order::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE(created_at) as label")
            ->selectRaw("SUM(total) as total")
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return [
            'summary' => [
                'total_spent' => (float)$orders->sum('total'),
                'total_orders' => $orders->count(),
            ],
            'chart' => [
                'labels' => $chart->pluck('label'),
                'data' => $chart->pluck('total')->map(fn($v) => (float)$v),
            ]
        ];
    }
}