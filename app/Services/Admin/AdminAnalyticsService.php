<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsService
{
    public function overview($user): array
    {
        return [
            'total_orders' => Order::count(),

            'pending_orders' => Order::where('status', 'pending')->count(),

            'paid_orders' => Order::whereIn('status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])->count(),

            'cancelled_orders' => Order::where('status', 'cancelled')->count(),

            'completed_orders' => Order::where('status', 'completed')->count(),

            'revenue' => (float) Order::whereIn('status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])->sum('total'),

            'completed_revenue' => (float) Order::where('status', 'completed')
                ->sum('total'),

            'total_users' => User::count(),

            'total_products' => Product::count(),

            'active_products' => Product::where('is_active', true)->count(),
        ];
    }

    public function topProducts($user, int $limit = 10): array
    {
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

    public function salesChart($user, int $days = 7): array
    {
        $from = Carbon::today()
            ->subDays($days - 1);

        $rows = Order::query()
            ->select([
                DB::raw('DATE(created_at) AS date'),
                DB::raw('SUM(total) AS revenue'),
                DB::raw('COUNT(*) AS orders_count'),
            ])
            ->whereIn('status', [
                'paid',
                'processing',
                'shipped',
                'completed',
            ])
            ->whereDate('created_at', '>=', $from)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $data = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $from->copy()->addDays($i)->format('Y-m-d');

            $row = $rows->get($date);

            $data[] = [
                'date' => $date,
                'revenue' => (float) ($row->revenue ?? 0),
                'orders_count' => (int) ($row->orders_count ?? 0),
            ];
        }

        return $data;
    }

    public function exportData($user): array
    {
        return [
            'overview' => $this->overview($user),
            'top_products' => $this->topProducts($user),
            'sales_chart' => $this->salesChart($user, 30),
            'generated_at' => now()->format('d/m/Y H:i'),
        ];
    }
}