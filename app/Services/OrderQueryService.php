<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderQueryService
{
    /**
     * My orders
     */
    public function myOrders($user, $filters)
    {
        $query = Order::query()
            ->with([
                'items.productVariant.product',
                'payments',
                'campaign'
            ])
            ->where('user_id', $user->id);

        // 🔥 filter status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // 🔥 filter type
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // 🔥 keyword
        if (!empty($filters['keyword'])) {
            $query->where('order_code', 'like', '%' . $filters['keyword'] . '%');
        }

        // 🔥 sorting
        $sort = $filters['sort'] ?? 'latest';

        if ($sort === 'oldest') {
            $query->oldest();
        } else {
            $query->latest();
        }

        // 🔥 pagination
        $perPage = $filters['per_page'] ?? 10;

        return $query->paginate($perPage);
    }

    /**
     * Show order detail
     */
    public function show($user, $id)
    {
        return Order::with([
            'items.productVariant.product',
            'payments',
            'campaign'
        ])
            ->where('user_id', $user->id)
            ->findOrFail($id);
    }

    /**
     * Cancel order
     */
    public function cancel($user, $id)
    {
        return DB::transaction(function () use ($user, $id) {

            $order = Order::with([
                'items.productVariant',
                'items.userCampaignItem'
            ])
                ->where('user_id', $user->id)
                ->findOrFail($id);

            if ($order->status !== 'pending') {
                throw new \Exception('Chỉ được hủy order pending');
            }

            foreach ($order->items as $item) {

                // 🔥 release reserved stock
                if ($item->productVariant) {
                    $item->productVariant->decrement(
                        'reserved_stock',
                        $item->quantity
                    );
                }

                // 🔥 release campaign reservation
                if ($item->userCampaignItem) {

                    $item->userCampaignItem->decrement(
                        'reserved_quantity',
                        $item->quantity
                    );
                }
            }

            $order->update([
                'status' => 'cancelled',
                'cancel_reason' => 'user_cancelled'
            ]);

            return $order->fresh();
        });
    }

    /**
     * Confirm order
     */
    public function confirm($user, $id)
    {
        $order = Order::where('user_id', $user->id)
            ->findOrFail($id);

        if ($order->status !== 'delivered') {
            throw new \Exception('Chỉ confirm order delivered');
        }

        $order->update([
            'status' => 'completed'
        ]);

        return $order->fresh();
    }
}