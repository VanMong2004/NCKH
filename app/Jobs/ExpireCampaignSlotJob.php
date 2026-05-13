<?php

namespace App\Jobs;

use App\Models\UserCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpireCampaignSlotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $expiredCampaigns = UserCampaign::with([
            'items'
        ])
        ->whereIn('status', ['approved', 'partial_paid'])
        ->whereNotNull('expires_at')
        ->where('expires_at', '<=', now())
        ->get();

        foreach ($expiredCampaigns as $userCampaign) {

            DB::transaction(function () use ($userCampaign) {

                foreach ($userCampaign->items as $item) {

                    // 🔥 release reserved
                    $item->update([
                        'reserved_quantity' => 0
                    ]);

                    // 🔥 auto expire item
                    if (
                        $item->paid_quantity <= 0
                    ) {
                        $item->update([
                            'status' => 'expired'
                        ]);
                    }
                }

                // 🔥 update campaign status
                $userCampaign->update([
                    'status' => 'expired'
                ]);

                Log::info('Campaign slot expired', [
                    'user_campaign_id' => $userCampaign->id
                ]);
            });
        }
    }
}