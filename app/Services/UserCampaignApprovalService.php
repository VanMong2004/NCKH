<?php

namespace App\Services;

use App\Models\UserCampaignItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserCampaignApprovalService
{
    public function approve($id, $approvedQuantity)
    {
        return DB::transaction(function () use ($id, $approvedQuantity) {

            $item = UserCampaignItem::with([
                'campaignItem',
                'userCampaign'
            ])->lockForUpdate()->findOrFail($id);

            if ($item->status !== 'pending') {
                throw new \Exception('Item đã xử lý');
            }

            if ($approvedQuantity > $item->quantity) {
                throw new \Exception('Approved quantity không hợp lệ');
            }

            $campaign = $item->userCampaign->campaign;

            // 🔥 check global limit
            if ($campaign->limit) {

                $approvedUsers = $campaign->userCampaigns()
                    ->where('status', 'approved')
                    ->count();

                if ($approvedUsers >= $campaign->limit) {
                    throw new \Exception('Campaign đã đầy');
                }
            }

            // 🔥 item limit
            $campaignItem = $item->campaignItem;

            if ($campaignItem->limit_quantity) {

                $approvedQty = UserCampaignItem::where(
                    'campaign_item_id',
                    $campaignItem->id
                )
                ->where('status', 'approved')
                ->sum('approved_quantity');

                $remain =
                    $campaignItem->limit_quantity
                    - $approvedQty;

                if ($approvedQuantity > $remain) {
                    throw new \Exception(
                        "Chỉ còn {$remain} slot"
                    );
                }
            }

            $item->update([
                'approved_quantity' => $approvedQuantity,
                'status' => 'approved',
            ]);

            // 🔥 approve parent
            $item->userCampaign->update([
                'status' => 'approved',
                'approved_at' => now(),
                'expires_at' => now()->addMinutes(
                    config(
                        'campaign.payment_expire_minutes',
                        30
                    )
                )
            ]);

            return [
                'success' => true,
                'message' => 'Approve thành công'
            ];
        });
    }

    public function reject($id)
    {
        $item = UserCampaignItem::findOrFail($id);

        $item->update([
            'status' => 'rejected',
            'approved_quantity' => 0
        ]);

        return [
            'success' => true,
            'message' => 'Reject thành công'
        ];
    }
}