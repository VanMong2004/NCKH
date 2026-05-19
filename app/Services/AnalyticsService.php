<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function overview($user)
    {
        $isAdmin = $user->role === 'admin';

        $orderQuery = Order::query();

        if (!$isAdmin) {
            $orderQuery->where(
                'user_id',
                $user->id
            );
        }

        return [

            'total_orders'=>
            $orderQuery->count(),

            'paid_orders'=>
            (clone $orderQuery)
                ->where(
                    'status',
                    'paid'
                )
                ->count(),

            'revenue'=>(float)
            (clone $orderQuery)
                ->where(
                    'status',
                    'paid'
                )
                ->sum(
                    'total'
                ),

            'total_users'=>
            $isAdmin
                ? User::count()
                : 1
        ];
    }

    public function topProducts($user)
    {
        $isAdmin = $user->role === 'admin';

        $query = \App\Models\OrderItem::query()
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
            ->where('orders.status', 'paid');

        if (!$isAdmin) {
            $query->where('orders.user_id', $user->id);
        }

        return $query
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

    public function salesChart(
        $user,
        $days = 7
    )
    {
        $isAdmin =
            $user->role === 'admin';

        $query = Order::query()
            ->where(
                'status',
                'paid'
            );

        if (!$isAdmin) {

            $query->where(
                'user_id',
                $user->id
            );
        }

        return $query
            ->select([
                DB::raw(
                    'DATE(created_at) as date'
                ),

                DB::raw(
                    'SUM(total) as revenue'
                )
            ])
            ->where(
                'created_at',
                '>=',
                now()->subDays($days)
            )
            ->groupBy(
                DB::raw(
                    'DATE(created_at)'
                )
            )
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
        return [

            'overview' =>
            $this->overview($user),

            'top_products' =>
            $this->topProducts($user),

            'sales_chart' =>
            $this->salesChart(
                $user,
                30
            )
        ];
    }
}