<?php

namespace App\Services;

use App\Models\UserCampaign;
use App\Models\UserCampaignItem;
use App\Models\OrderItem;

class MyCampaignService
{
    /**
     * List my campaigns
     */
    public function list($user, $filters)
    {
        $query = UserCampaign::with([
            'campaign',
            'items.campaignItem.productVariant.product'
        ])
        ->where('user_id', $user->id);

        // 🔥 status
        if (!empty($filters['status'])) {

            $query->where(
                'status',
                $filters['status']
            );
        }

        // 🔥 keyword
        if (!empty($filters['keyword'])) {

            $query->whereHas('campaign', function ($q) use ($filters) {

                $q->where(
                    'title',
                    'like',
                    '%' . $filters['keyword'] . '%'
                );
            });
        }

        // 🔥 campaign_id
        if (!empty($filters['campaign_id'])) {

            $query->where(
                'campaign_id',
                $filters['campaign_id']
            );
        }

        $perPage = $filters['per_page'] ?? 10;

        $campaigns = $query
            ->latest()
            ->paginate($perPage);

        $campaigns->setCollection(
            $campaigns->getCollection()->map(function ($userCampaign) {

                $campaign = $userCampaign->campaign;

                $totalQuantity = $userCampaign->items->sum('quantity');

                $approvedQuantity = $userCampaign->items->sum('approved_quantity');

                $paidQuantity = $userCampaign->items->sum('paid_quantity');

                $registeredItems = $userCampaign->items->map(function ($item) {

                    $campaignItem = $item->campaignItem;

                    $variant = $campaignItem?->productVariant;

                    $product = $variant?->product;

                    return [
                        'id' => $item->id,

                        'product_name' => $product?->name,

                        'variant' => [
                            'sku' => $variant?->sku,
                            'size' => $variant?->size,
                            'color' => $variant?->color,
                        ],

                        'price' => $campaignItem?->price,

                        'quantity' => $item->quantity,

                        'approved_quantity' => $item->approved_quantity,

                        'paid_quantity' => $item->paid_quantity,

                        'status' => $item->status,
                    ];
                });

                return [
                    'id' => $userCampaign->id,

                    'campaign_id' => $campaign?->id,

                    'title' => $campaign?->title,

                    'slug' => $campaign?->slug,

                    'thumbnail' => $campaign?->thumbnail,

                    'banner' => $campaign?->banner,

                    'campaign_status' => $campaign?->status,

                    'registration_status' => $userCampaign->status,

                    'start_date' => optional($campaign?->start_date)->format('d/m/Y H:i'),

                    'end_date' => optional($campaign?->end_date)->format('d/m/Y H:i'),

                    'countdown_seconds' => $campaign && $campaign->end_date
                        ? now()->diffInSeconds($campaign->end_date, false)
                        : null,

                    'total_quantity' => $totalQuantity,

                    'approved_quantity' => $approvedQuantity,

                    'paid_quantity' => $paidQuantity,

                    'items' => $registeredItems,

                    'detail_url' => '/profile/campaigns/' . $userCampaign->id,

                    'created_at' => optional($userCampaign->created_at)->format('d/m/Y H:i'),
                ];
            })
        );

        return $campaigns;
    }

    /**
     * Detail
     */
    public function detail($user, $id)
    {
        $userCampaign = UserCampaign::with([
            'campaign',
            'items.campaignItem.productVariant.product.images',
            'items.orderItems.order',
        ])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        $campaign = $userCampaign->campaign;

        return [
            'id' => $userCampaign->id,
            'status' => $userCampaign->status,
            'approved_at' => optional($userCampaign->approved_at)->format('d/m/Y H:i'),
            'expires_at' => optional($userCampaign->expires_at)->format('d/m/Y H:i'),
            'created_at' => optional($userCampaign->created_at)->format('d/m/Y H:i'),

            'campaign' => [
                'id' => $campaign?->id,
                'title' => $campaign?->title,
                'slug' => $campaign?->slug,
                'description' => $campaign?->description,
                'banner' => $campaign?->banner,
                'thumbnail' => $campaign?->thumbnail,
                'limit' => $campaign?->limit,
                'start_date' => optional($campaign?->start_date)->format('d/m/Y H:i'),
                'end_date' => optional($campaign?->end_date)->format('d/m/Y H:i'),
                'status' => $campaign?->status,
                'countdown_seconds' => $campaign?->end_date
                    ? now()->diffInSeconds($campaign->end_date, false)
                    : null,
            ],

            'items' => $userCampaign->items->map(function (UserCampaignItem $item) {
                $campaignItem = $item->campaignItem;
                $variant = $campaignItem?->productVariant;
                $product = $variant?->product;

                $thumbnail = optional(
                    $product?->images?->where('type', 'thumbnail')->first()
                )->url ?? optional($product?->images?->first())->url;

                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'approved_quantity' => $item->approved_quantity,
                    'paid_quantity' => $item->paid_quantity,
                    'reserved_quantity' => $item->reserved_quantity,
                    'status' => $item->status,

                    'product' => [
                        'id' => $product?->id,
                        'name' => $product?->name,
                        'slug' => $product?->slug,
                        'thumbnail' => $thumbnail,
                        'average_rating' => (float) ($product?->average_rating ?? 0),
                    ],

                    'variant' => [
                        'id' => $variant?->id,
                        'sku' => $variant?->sku,
                        'size' => $variant?->size,
                        'color' => $variant?->color,
                        'stock' => $variant?->stock,
                    ],

                    'price' => $campaignItem?->price,
                    'limit_quantity' => $campaignItem?->limit_quantity,
                    'registered_quantity' => $campaignItem?->registered_quantity,

                    'orders' => $item->orderItems->map(function (OrderItem $orderItem) {
                        return [
                            'order_id' => $orderItem->order?->id,
                            'order_code' => $orderItem->order?->order_code,
                            'order_status' => $orderItem->order?->status,
                            'quantity' => $orderItem->quantity,
                            'total' => $orderItem->price * $orderItem->quantity,
                        ];
                    }),
                ];
            }),

            'timeline' => [
                [
                    'label' => 'Đã đăng ký',
                    'status' => true,
                    'time' => optional($userCampaign->created_at)->format('d/m/Y H:i'),
                ],
                [
                    'label' => 'Đã duyệt',
                    'status' => $userCampaign->status === 'approved',
                    'time' => optional($userCampaign->approved_at)->format('d/m/Y H:i'),
                ],
                [
                    'label' => 'Chờ thanh toán/nhận hàng',
                    'status' => in_array($userCampaign->status, ['approved', 'paid', 'completed']),
                    'time' => null,
                ],
            ],
        ];
    }
}