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

        return $query->latest()
            ->paginate($perPage);
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