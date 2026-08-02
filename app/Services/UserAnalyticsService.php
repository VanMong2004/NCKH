<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RecentlyViewedProduct;
use App\Models\Review;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class UserAnalyticsService
{
    public function overview($user)
    {
        $this->ensureUser($user);

        return [
            'orders' => $this->orders($user),
            'spending' => $this->spending($user),
            'interests' => $this->interests($user),
            'tracking' => $this->orderTracking($user),
        ];
    }

    public function orders($user, int $months = 12)
    {
        $this->ensureUser($user);

        $orderQuery = Order::query()
            ->where('user_id', $user->id);

        $paidOrderQuery = (clone $orderQuery)
            ->whereIn('status', $this->paidStatuses());

        return [
            'total_orders' => (clone $orderQuery)->count(),

            'total_spent' => (float) $paidOrderQuery->sum('total'),

            'recent_orders' => (clone $orderQuery)
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($order) => $this->formatOrderTracking($order)),

            'monthly_orders' => (clone $orderQuery)
                ->select([
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    DB::raw('COUNT(*) as total'),
                ])
                ->where('created_at', '>=', now()->subMonths($months))
                ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
                ->orderBy('month')
                ->get()
                ->map(fn ($item) => [
                    'month' => $item->month,
                    'total' => (int) $item->total,
                ]),

            'status_breakdown' => (clone $orderQuery)
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->get()
                ->map(fn ($item) => [
                    'status' => $item->status,
                    'total' => (int) $item->total,
                ]),
        ];
    }

    public function spending($user, int $months = 12)
    {
        $this->ensureUser($user);

        $paidOrders = Order::query()
            ->where('user_id', $user->id)
            ->whereIn('status', $this->paidStatuses());

        $highestOrder = (clone $paidOrders)
            ->orderByDesc('total')
            ->first();

        return [
            'total_spent' => (float) (clone $paidOrders)->sum('total'),

            'monthly_spending' => (clone $paidOrders)
                ->select([
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    DB::raw('SUM(total) as total'),
                ])
                ->where('created_at', '>=', now()->subMonths($months))
                ->groupBy(DB::raw("DATE_FORMAT(created_at, '%Y-%m')"))
                ->orderBy('month')
                ->get()
                ->map(fn ($item) => [
                    'month' => $item->month,
                    'total' => (float) $item->total,
                ]),

            'spending_by_category' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->leftJoin('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
                ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
                ->where('orders.user_id', $user->id)
                ->whereIn('orders.status', $this->paidStatuses())
                ->selectRaw('
                    categories.id as category_id,
                    categories.name as category_name,
                    SUM(order_items.final_price * order_items.quantity) as total
                ')
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total')
                ->get()
                ->map(fn ($item) => [
                    'category_id' => $item->category_id,
                    'category_name' => $item->category_name ?? 'Không phân loại',
                    'total' => (float) $item->total,
                ]),

            'highest_order' => $highestOrder
                ? [
                    'id' => $highestOrder->id,
                    'order_code' => $highestOrder->order_code,
                    'status' => $highestOrder->status,
                    'fulfillment_method' => $highestOrder->fulfillment_method,
                    'total' => (float) $highestOrder->total,
                    'created_at' => optional($highestOrder->created_at)->format('d/m/Y H:i'),
                ]
                : null,
        ];
    }

    public function interests($user)
    {
        $this->ensureUser($user);

        return [
            'most_purchased_products' => OrderItem::query()
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->leftJoin('product_variants', 'product_variants.id', '=', 'order_items.product_variant_id')
                ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
                ->where('orders.user_id', $user->id)
                ->whereIn('orders.status', $this->paidStatuses())
                ->selectRaw('
                    products.id as product_id,
                    products.name as name,
                    products.slug as slug,
                    SUM(order_items.quantity) as total_quantity
                ')
                ->groupBy('products.id', 'products.name', 'products.slug')
                ->orderByDesc('total_quantity')
                ->limit(10)
                ->get()
                ->map(fn ($item) => [
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'slug' => $item->slug,
                    'total_quantity' => (int) $item->total_quantity,
                ]),

            'most_viewed_products' => RecentlyViewedProduct::query()
                ->with('product')
                ->where('user_id', $user->id)
                ->orderByDesc('viewed_at')
                ->limit(10)
                ->get()
                ->filter(fn ($item) => $item->product)
                ->map(fn ($item) => [
                    'product_id' => $item->product->id,
                    'name' => $item->product->name,
                    'slug' => $item->product->slug,
                    'viewed_at' => optional($item->viewed_at)->format('d/m/Y H:i'),
                ])
                ->values(),

            'reviewed_products' => Review::query()
                ->with('product')
                ->where('user_id', $user->id)
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($review) => [
                    'review_id' => $review->id,
                    'product_id' => $review->product?->id,
                    'product_name' => $review->product?->name,
                    'rating' => (int) $review->rating,
                    'comment' => $review->comment,
                    'created_at' => optional($review->created_at)->format('d/m/Y H:i'),
                ]),
        ];
    }

    public function orderTracking($user)
    {
        $this->ensureUser($user);

        return [
            'orders' => Order::query()
                ->where('user_id', $user->id)
                ->whereIn('status', [
                    'pending',
                    'processing',
                    'awaiting_receipt',
                ])
                ->latest('updated_at')
                ->limit(10)
                ->get()
                ->map(fn ($order) => $this->formatOrderTracking($order)),

            'last_updated_at' => now()->format('d/m/Y H:i:s'),

            'note' => 'Dữ liệu được cập nhật theo cơ chế gọi API định kỳ từ frontend. Chưa sử dụng WebSocket realtime.',
        ];
    }

    public function exportData($user)
    {
        $this->ensureUser($user);

        return [
            'orders' => $this->orders($user, 12),
            'spending' => $this->spending($user, 12),
            'interests' => $this->interests($user),
            'tracking' => $this->orderTracking($user),
            'generated_at' => now()->format('d/m/Y H:i'),
        ];
    }

    private function paidStatuses(): array
    {
        return [
            'processing',
            'awaiting_receipt',
            'completed',
        ];
    }

    private function formatOrderTracking($order): array
    {
        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'fulfillment_method' => $order->fulfillment_method,
            'total' => (float) $order->total,
            'updated_at' => optional($order->updated_at)->format('d/m/Y H:i'),
            'progress' => $this->orderProgress($order),
        ];
    }

    private function orderProgress(Order $order): array
    {
        $awaitingReceiptLabel = $order->fulfillment_method === 'pickup'
            ? 'Sẵn sàng nhận tại phòng'
            : 'Đang giao';

        $steps = [
            'pending' => 'Đã tạo đơn',
            'processing' => 'Đang chuẩn bị',
            'awaiting_receipt' => $awaitingReceiptLabel,
            'completed' => 'Hoàn thành',
        ];

        $keys = array_keys($steps);
        $currentIndex = array_search($order->status, $keys, true);

        return collect($steps)
            ->map(function ($label, $key) use ($currentIndex, $keys) {
                $stepIndex = array_search($key, $keys, true);

                return [
                    'key' => $key,
                    'label' => $label,
                    'done' => $currentIndex !== false && $stepIndex <= $currentIndex,
                ];
            })
            ->values()
            ->toArray();
    }

    private function ensureUser($user): void
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }
    }
}
