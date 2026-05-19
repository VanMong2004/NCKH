<?php

namespace App\Services;

use App\Models\UserCampaign;

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
        return UserCampaign::with([

            'campaign',

            'items.campaignItem.productVariant.product',

            'items.orderItems.order'

        ])
        ->where('user_id', $user->id)
        ->findOrFail($id);
    }
}