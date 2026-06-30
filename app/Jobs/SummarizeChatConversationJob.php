<?php

namespace App\Jobs;

use App\Services\Chat\ChatConversationSummaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SummarizeChatConversationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 2;

    public function __construct(
        public int $conversationId
    ) {
        $this->onQueue('chat');
    }

    public function handle(ChatConversationSummaryService $service): void
    {
        try {
            $service->summarize($this->conversationId);
        } catch (Throwable $e) {
            Log::warning('Chat conversation summary failed', [
                'conversation_id' => $this->conversationId,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
