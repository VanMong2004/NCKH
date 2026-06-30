<?php

namespace App\Console\Commands;

use App\Models\ChatConversation;
use Illuminate\Console\Command;

class ExpireChatConversations extends Command
{
    protected $signature = 'chat:expire-conversations {--days= : So ngay khong hoat dong truoc khi het han}';

    protected $description = 'Expire inactive chat conversations';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('services.openai.chat_session_expire_days', 7));
        $days = max(1, $days);
        $expiredBefore = now()->subDays($days);

        $count = ChatConversation::query()
            ->where('status', 'active')
            ->whereNotNull('last_message_at')
            ->where('last_message_at', '<', $expiredBefore)
            ->update([
                'status' => 'expired',
                'expired_at' => now(),
            ]);

        $this->info("Expired {$count} chat conversation(s).");

        return Command::SUCCESS;
    }
}
