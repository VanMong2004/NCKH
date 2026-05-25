<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AdminAnalyticsService
{
    public function overview($user)
    {
        $this->ensureAdmin($user);

        $orderQuery = Order::query();

        return [
            'total_orders' => (clone $orderQuery)->count(),

            'paid_orders' => (clone $orderQuery)
                ->where('status', 'paid')
                ->count(),

            'revenue' => (float) (clone $orderQuery)
                ->where('status', 'paid')
                ->sum('total'),

            'total_users' => User::count(),
        ];
    }

    public function topProducts($user)
    {
        $this->ensureAdmin($user);

        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin(
                'product_variants',
                'product_variants.id',
                '=',
                'order_items.product_variant_id'
            )
            ->leftJoin(
                'products',
                'products.id',
                '=',
                'product_variants.product_id'
            )
            ->where('orders.status', 'paid')
            ->selectRaw('
                products.id as product_id,
                products.name as name,
                products.slug as slug,
                SUM(order_items.quantity) as sold,
                SUM(order_items.price * order_items.quantity) as revenue
            ')
            ->groupBy(
                'products.id',
                'products.name',
                'products.slug'
            )
            ->orderByDesc('sold')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'sold' => (int) $item->sold,
                    'revenue' => (float) $item->revenue,
                ];
            });
    }

    public function salesChart($user, int $days = 7)
    {
        $this->ensureAdmin($user);

        return Order::query()
            ->where('status', 'paid')
            ->select([
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
            ])
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'revenue' => (float) $item->revenue,
                ];
            });
    }

    public function exportData($user)
    {
        $this->ensureAdmin($user);

        return [
            'overview' => $this->overview($user),
            'top_products' => $this->topProducts($user),
            'sales_chart' => $this->salesChart($user, 30),
        ];
    }

    private function ensureAdmin($user): void
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        if ($user->role !== 'admin') {
            throw new RuntimeException('Bạn không có quyền truy cập thống kê quản trị', 403);
        }
    }
}