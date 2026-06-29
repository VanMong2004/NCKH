<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AdminAnalyticsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public array $summary
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.analytics'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'analytics.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'summary' => $this->summary,
        ];
    }
}
