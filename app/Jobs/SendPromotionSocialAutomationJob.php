<?php

namespace App\Jobs;

use App\Models\SocialAutomationLog;
use App\Services\Social\N8nSocialAutomationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPromotionSocialAutomationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $logId)
    {
        $this->onQueue('social');
    }

    public function handle(N8nSocialAutomationService $service): void
    {
        $log = SocialAutomationLog::query()->find($this->logId);

        if (!$log) {
            return;
        }

        $service->sendLogToN8n($log);
    }
}