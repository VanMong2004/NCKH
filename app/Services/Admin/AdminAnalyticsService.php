<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\AnalyticsDailyMetric;
use App\Services\Analytics\AnalyticsEventService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    public function __construct(
        protected AnalyticsEventService $analyticsEventService
    ) {}

    public function overview($user): array
    {
        $orderOverview = Order::query()
            ->selectRaw('COUNT(*) AS total_orders')
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_orders")
            ->selectRaw("SUM(CASE WHEN status IN ('paid', 'processing', 'shipped') THEN 1 ELSE 0 END) AS paid_orders")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders")
            ->selectRaw("SUM(CASE WHEN status IN ('paid', 'processing', 'shipped', 'completed') THEN total ELSE 0 END) AS revenue")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) AS completed_revenue")
            ->first();

        $productOverview = Product::query()
            ->selectRaw('COUNT(*) AS total_products')
            ->selectRaw("SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_products")
            ->selectRaw('COALESCE(SUM(view_count), 0) AS product_view_count')
            ->first();

        return [
            'total_orders' => (int) ($orderOverview->total_orders ?? 0),

            'pending_orders' => (int) ($orderOverview->pending_orders ?? 0),

            'paid_orders' => (int) ($orderOverview->paid_orders ?? 0),

            'cancelled_orders' => (int) ($orderOverview->cancelled_orders ?? 0),

            'completed_orders' => (int) ($orderOverview->completed_orders ?? 0),

            'revenue' => (float) ($orderOverview->revenue ?? 0),

            'completed_revenue' => (float) ($orderOverview->completed_revenue ?? 0),

            'total_users' => User::count(),

            'total_products' => (int) ($productOverview->total_products ?? 0),

            'active_products' => (int) ($productOverview->active_products ?? 0),

            'product_view_count' => (int) ($productOverview->product_view_count ?? 0),
        ];
    }

    public function behaviorOverview($user, int $days = 30, array $filters = []): array
    {
        if (!empty($filters['date_from']) || !empty($filters['date_to'])) {
            [$from, $to] = $this->dateRangeFromFilters($days, $filters);

            return $this->analyticsEventService->summaryBetween($from, $to);
        }

        return $this->analyticsEventService->summary($days);
    }

    public function topProducts($user, int $limit = 10, array $filters = []): array
    {
        [$from, $to] = $this->dateRangeFromFilters(30, $filters);

        return OrderItem::query()
            ->select([
                'products.id',
                'products.name',
                'products.slug',
                DB::raw('SUM(order_items.quantity) AS sold'),
                DB::raw('SUM(order_items.final_price * order_items.quantity) AS revenue'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereIn('orders.status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy([
                'products.id',
                'products.name',
                'products.slug',
            ])
            ->orderByDesc('sold')
            ->limit($limit)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'slug' => $item->slug,
                'sold' => (int) $item->sold,
                'revenue' => (float) $item->revenue,
            ])
            ->values()
            ->toArray();
    }

    public function salesChart($user, int $days = 7, array $filters = []): array
    {
        $range = $this->resolveRange($days, $filters);
        $from = $range['from'];
        $to = $range['to'];
        $groupExpression = $range['group_expression'];
        $periods = $range['periods'];

        $rows = Order::query()
            ->select([
                DB::raw("{$groupExpression} AS period_key"),
                DB::raw('SUM(total) AS revenue'),
                DB::raw('COUNT(*) AS orders_count'),
            ])
            ->whereIn('status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])
            ->whereBetween('created_at', [$from, $to])
            ->groupBy(DB::raw($groupExpression))
            ->orderBy('period_key')
            ->get()
            ->keyBy('period_key');

        return collect($periods)
            ->map(function ($period) use ($rows) {
                $row = $rows->get($period['key']);

                return [
                    'date' => $period['key'],
                    'label' => $period['label'],
                    'revenue' => (float) ($row->revenue ?? 0),
                    'orders_count' => (int) ($row->orders_count ?? 0),
                ];
            })
            ->values()
            ->toArray();
    }

    public function topViewedProducts($user, int $limit = 10): array
    {
        return Product::query()
            ->select(['id', 'name', 'slug', 'view_count', 'sold_count'])
            ->where('is_active', true)
            ->orderByDesc('view_count')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'views' => (int) ($product->view_count ?? 0),
                'sold' => (int) ($product->sold_count ?? 0),
            ])
            ->values()
            ->toArray();
    }

    public function behaviorChart($user, int $days = 30, array $filters = []): array
    {
        $range = $this->resolveRange($days, $filters);
        $from = $range['from'];
        $to = $range['to'];
        $groupExpression = str_replace('created_at', 'metric_date', $range['group_expression']);
        $periods = $range['periods'];

        $rows = AnalyticsDailyMetric::query()
            ->select([
                DB::raw("{$groupExpression} AS period_key"),
                DB::raw('SUM(visitors_count) AS visitors'),
                DB::raw('SUM(page_views_count) AS page_views'),
                DB::raw('SUM(product_views_count) AS product_views'),
            ])
            ->whereDate('metric_date', '>=', $from)
            ->whereDate('metric_date', '<=', $to)
            ->groupBy(DB::raw($groupExpression))
            ->orderBy('period_key')
            ->get()
            ->keyBy('period_key');

        return collect($periods)
            ->map(function ($period) use ($rows) {
                $row = $rows->get($period['key']);

                return [
                    'date' => $period['key'],
                    'label' => $period['label'],
                    'visitors' => (int) ($row->visitors ?? 0),
                    'page_views' => (int) ($row->page_views ?? 0),
                    'product_views' => (int) ($row->product_views ?? 0),
                ];
            })
            ->values()
            ->toArray();
    }

    public function revenueByCategory($user, int $limit = 8, array $filters = []): array
    {
        [$from, $to] = $this->dateRangeFromFilters(30, $filters);

        return OrderItem::query()
            ->select([
                'categories.id',
                DB::raw('COALESCE(categories.name, "Chưa phân loại") AS name'),
                DB::raw('SUM(order_items.final_price * order_items.quantity) AS revenue'),
                DB::raw('SUM(order_items.quantity) AS sold'),
            ])
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereIn('orders.status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])
            ->whereBetween('orders.created_at', [$from, $to])
            ->groupBy([
                'categories.id',
                'categories.name',
            ])
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'revenue' => (float) $item->revenue,
                'sold' => (int) $item->sold,
            ])
            ->values()
            ->toArray();
    }

    private function resolveRange(int $days, array $filters = []): array
    {
        if (!empty($filters['date_from']) || !empty($filters['date_to'])) {
            [$from, $to] = $this->dateRangeFromFilters($days, $filters);

            return $this->customRange($from, $to, $filters['group_by'] ?? 'day');
        }

        $days = in_array($days, [7, 30, 90, 365], true) ? $days : 30;
        $from = Carbon::today()->subDays($days - 1);

        if ($days === 365) {
            $start = Carbon::today()->startOfMonth()->subMonths(11);
            $periods = [];

            for ($i = 0; $i < 12; $i++) {
                $date = $start->copy()->addMonths($i);
                $periods[] = [
                    'key' => $date->format('Y-m'),
                    'label' => $date->format('m/Y'),
                ];
            }

            return [
                'from' => $start,
                'to' => Carbon::today()->endOfDay(),
                'group_expression' => 'DATE_FORMAT(created_at, "%Y-%m")',
                'periods' => $periods,
            ];
        }

        if ($days === 90) {
            $start = Carbon::today()->startOfWeek()->subWeeks(12);
            $periods = [];

            for ($i = 0; $i < 13; $i++) {
                $date = $start->copy()->addWeeks($i);
                $periods[] = [
                    'key' => $date->format('o-W'),
                    'label' => 'Tuần ' . $date->format('W'),
                ];
            }

            return [
                'from' => $start,
                'to' => Carbon::today()->endOfDay(),
                'group_expression' => 'DATE_FORMAT(created_at, "%x-%v")',
                'periods' => $periods,
            ];
        }

        $periods = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i);
            $periods[] = [
                'key' => $date->format('Y-m-d'),
                'label' => $date->format('d/m'),
            ];
        }

        return [
            'from' => $from,
            'to' => Carbon::today()->endOfDay(),
            'group_expression' => 'DATE(created_at)',
            'periods' => $periods,
        ];
    }

    private function dateRangeFromFilters(int $days, array $filters): array
    {
        $defaultFrom = Carbon::today()->subDays(max(1, min($days, 365)) - 1);
        $defaultTo = Carbon::today()->endOfDay();

        $from = !empty($filters['date_from'])
            ? Carbon::parse($filters['date_from'])->startOfDay()
            : $defaultFrom;

        $to = !empty($filters['date_to'])
            ? Carbon::parse($filters['date_to'])->endOfDay()
            : $defaultTo;

        if ($to->lt($from)) {
            [$from, $to] = [$to, $from];
        }

        return [$from, $to];
    }

    private function customRange(Carbon $from, Carbon $to, string $groupBy): array
    {
        $groupBy = in_array($groupBy, ['day', 'week', 'month', 'year'], true) ? $groupBy : 'day';

        if ($groupBy === 'year') {
            return $this->buildCustomPeriods($from, $to, 'year', 'DATE_FORMAT(created_at, "%Y")');
        }

        if ($groupBy === 'month') {
            return $this->buildCustomPeriods($from, $to, 'month', 'DATE_FORMAT(created_at, "%Y-%m")');
        }

        if ($groupBy === 'week') {
            return $this->buildCustomPeriods($from, $to, 'week', 'DATE_FORMAT(created_at, "%x-%v")');
        }

        return $this->buildCustomPeriods($from, $to, 'day', 'DATE(created_at)');
    }

    private function buildCustomPeriods(Carbon $from, Carbon $to, string $unit, string $expression): array
    {
        $cursor = match ($unit) {
            'year' => $from->copy()->startOfYear(),
            'month' => $from->copy()->startOfMonth(),
            'week' => $from->copy()->startOfWeek(),
            default => $from->copy()->startOfDay(),
        };

        $end = match ($unit) {
            'year' => $to->copy()->startOfYear(),
            'month' => $to->copy()->startOfMonth(),
            'week' => $to->copy()->startOfWeek(),
            default => $to->copy()->startOfDay(),
        };

        $periods = [];

        while ($cursor->lte($end)) {
            $periods[] = [
                'key' => match ($unit) {
                    'year' => $cursor->format('Y'),
                    'month' => $cursor->format('Y-m'),
                    'week' => $cursor->format('o-W'),
                    default => $cursor->format('Y-m-d'),
                },
                'label' => match ($unit) {
                    'year' => $cursor->format('Y'),
                    'month' => $cursor->format('m/Y'),
                    'week' => 'Tuần ' . $cursor->format('W'),
                    default => $cursor->format('d/m'),
                },
            ];

            match ($unit) {
                'year' => $cursor->addYear(),
                'month' => $cursor->addMonth(),
                'week' => $cursor->addWeek(),
                default => $cursor->addDay(),
            };
        }

        return [
            'from' => $from,
            'to' => $to,
            'group_expression' => $expression,
            'periods' => $periods,
        ];
    }

    public function exportData($user): array
    {
        return [
            'overview' => $this->overview($user),
            'behavior_overview' => $this->behaviorOverview($user, 30),
            'top_products' => $this->topProducts($user),
            'sales_chart' => $this->salesChart($user, 30),
            'generated_at' => now()->format('d/m/Y H:i'),
        ];
    }
}
