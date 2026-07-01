<?php

namespace App\Services\Analytics;

use App\Events\AdminAnalyticsUpdated;
use App\Models\AnalyticsDailyMetric;
use App\Models\AnalyticsEvent;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyticsEventService
{
    public function trackFromRequest(Request $request, ?string $eventType = null, array $extra = []): ?AnalyticsEvent
    {
        return $this->track(
            $eventType ?: (string) $request->input('event_type'),
            $request,
            array_merge($request->all(), $extra)
        );
    }

    public function track(string $eventType, Request $request, array $data = []): ?AnalyticsEvent
    {
        if (!in_array($eventType, $this->allowedEventTypes(), true)) {
            return null;
        }

        try {
            return DB::transaction(function () use ($eventType, $request, $data) {
                $occurredAt = isset($data['occurred_at'])
                    ? Carbon::parse($data['occurred_at'])
                    : now();

                $visitorId = $this->cleanString($data['visitor_id'] ?? $request->header('X-Visitor-Id'), 100);
                $sessionId = $this->cleanString($data['session_id'] ?? $request->header('X-Session-Id'), 100);
                $user = auth('sanctum')->user();

                $event = AnalyticsEvent::create([
                    'event_type' => $eventType,
                    'visitor_id' => $visitorId,
                    'session_id' => $sessionId,
                    'user_id' => $user?->id,
                    'guest_token' => $this->cleanString($request->header('X-Guest-Token'), 120),
                    'entity_type' => $this->cleanString($data['entity_type'] ?? null, 50),
                    'entity_id' => $data['entity_id'] ?? null,
                    'product_id' => $data['product_id'] ?? null,
                    'product_variant_id' => $data['product_variant_id'] ?? null,
                    'order_id' => $data['order_id'] ?? null,
                    'url' => $this->cleanString($data['url'] ?? null, 1000),
                    'referrer' => $this->cleanString($data['referrer'] ?? null, 1000),
                    'ip_hash' => hash('sha256', (string) $request->ip()),
                    'user_agent' => $this->cleanString((string) $request->userAgent(), 2000),
                    'metadata' => $data['metadata'] ?? null,
                    'occurred_at' => $occurredAt,
                ]);

                $this->updateDailyMetric(
                    $event,
                    $this->isFirstVisitorOfDay($visitorId, $occurredAt, $event->id),
                    $this->isFirstSessionOfDay($sessionId, $occurredAt, $event->id)
                );

                $this->incrementProductViewCountOnce($event);

                $this->broadcastSummary($eventType);

                return $event;
            });
        } catch (\Throwable $e) {
            Log::warning('Analytics event tracking failed', [
                'event_type' => $eventType,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function trackAddToCart(Request $request, ProductVariant $variant, int $quantity): void
    {
        $this->track(AnalyticsEvent::ADD_TO_CART, $request, [
            'entity_type' => 'product',
            'entity_id' => $variant->product_id,
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'metadata' => [
                'quantity' => $quantity,
            ],
        ]);
    }

    public function trackCheckoutStarted(Request $request, array $cartItemIds): void
    {
        $this->track(AnalyticsEvent::CHECKOUT_STARTED, $request, [
            'entity_type' => 'checkout',
            'metadata' => [
                'cart_item_ids' => array_values($cartItemIds),
            ],
        ]);
    }

    public function trackPurchaseCompleted(Request $request, Order $order): void
    {
        $this->track(AnalyticsEvent::PURCHASE_COMPLETED, $request, [
            'entity_type' => 'order',
            'entity_id' => $order->id,
            'order_id' => $order->id,
            'metadata' => [
                'order_code' => $order->order_code,
                'total' => (float) $order->total,
                'status' => $order->status,
            ],
        ]);
    }

    public function trackPurchaseCompletedForOrder(Order $order): void
    {
        try {
            DB::transaction(function () use ($order) {
                if (AnalyticsEvent::query()
                    ->where('event_type', AnalyticsEvent::PURCHASE_COMPLETED)
                    ->where('order_id', $order->id)
                    ->exists()
                ) {
                    return;
                }

                $event = AnalyticsEvent::create([
                    'event_type' => AnalyticsEvent::PURCHASE_COMPLETED,
                    'visitor_id' => null,
                    'session_id' => null,
                    'user_id' => $order->user_id,
                    'guest_token' => $order->guest_token,
                    'entity_type' => 'order',
                    'entity_id' => $order->id,
                    'order_id' => $order->id,
                    'ip_hash' => null,
                    'user_agent' => null,
                    'metadata' => [
                        'order_code' => $order->order_code,
                        'total' => (float) $order->total,
                        'status' => $order->status,
                        'source' => 'order_paid_event',
                    ],
                    'occurred_at' => now(),
                ]);

                $this->updateDailyMetric($event, false, false);
                $this->broadcastSummary(AnalyticsEvent::PURCHASE_COMPLETED);
            });
        } catch (\Throwable $e) {
            Log::warning('Track purchase completed from order failed', [
                'order_id' => $order->id,
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function summary(int $days = 30): array
    {
        $days = max(1, min($days, 365));
        $from = today()->subDays($days - 1);
        $to = today();

        return $this->summaryBetween($from, $to);
    }

    public function summaryBetween(Carbon $from, Carbon $to): array
    {
        if ($to->lt($from)) {
            [$from, $to] = [$to, $from];
        }

        try {
            $totals = AnalyticsDailyMetric::query()
                ->whereDate('metric_date', '>=', $from)
                ->whereDate('metric_date', '<=', $to)
                ->selectRaw('
                    COALESCE(SUM(visitors_count), 0) as visitors_count,
                    COALESCE(SUM(sessions_count), 0) as sessions_count,
                    COALESCE(SUM(page_views_count), 0) as page_views_count,
                    COALESCE(SUM(product_views_count), 0) as product_views_count,
                    COALESCE(SUM(add_to_cart_count), 0) as add_to_cart_count,
                    COALESCE(SUM(checkout_started_count), 0) as checkout_started_count,
                    COALESCE(SUM(purchase_completed_count), 0) as purchase_completed_count,
                    COALESCE(SUM(bounce_sessions_count), 0) as bounce_sessions_count
                ')
                ->first();

            $visitors = (int) ($totals->visitors_count ?? 0);
            $sessions = (int) ($totals->sessions_count ?? 0);
            $productViews = (int) ($totals->product_views_count ?? 0);
            $addToCart = (int) ($totals->add_to_cart_count ?? 0);
            $checkoutStarted = (int) ($totals->checkout_started_count ?? 0);
            $purchases = (int) ($totals->purchase_completed_count ?? 0);
            $bounces = (int) ($totals->bounce_sessions_count ?? 0);
            $pageViews = (int) ($totals->page_views_count ?? 0);
        } catch (\Throwable $e) {
            Log::warning('Analytics summary failed', [
                'message' => $e->getMessage(),
            ]);

            $visitors = 0;
            $sessions = 0;
            $pageViews = 0;
            $productViews = 0;
            $addToCart = 0;
            $checkoutStarted = 0;
            $purchases = 0;
            $bounces = 0;
        }

        return [
            'visitors' => $visitors,
            'sessions' => $sessions,
            'page_views' => $pageViews,
            'product_views' => $productViews,
            'add_to_cart' => $addToCart,
            'checkout_started' => $checkoutStarted,
            'purchases' => $purchases,
            'bounce_sessions' => $bounces,
            'add_to_cart_rate' => $this->percent($addToCart, $productViews),
            'checkout_rate' => $this->percent($checkoutStarted, $addToCart),
            'purchase_rate' => $this->percent($purchases, $checkoutStarted),
            'conversion_rate' => $this->percent($purchases, $visitors ?: $sessions),
            'bounce_rate' => $this->percent($bounces, $sessions),
            'repeat_purchase_rate' => $this->repeatPurchaseRate($from),
        ];
    }

    private function updateDailyMetric(AnalyticsEvent $event, bool $isNewVisitor, bool $isNewSession): void
    {
        $metric = AnalyticsDailyMetric::firstOrCreate([
            'metric_date' => $event->occurred_at->toDateString(),
        ]);

        $increments = match ($event->event_type) {
            AnalyticsEvent::PAGE_VIEW => ['page_views_count' => 1],
            AnalyticsEvent::PRODUCT_VIEW => ['product_views_count' => 1],
            AnalyticsEvent::ADD_TO_CART => ['add_to_cart_count' => 1],
            AnalyticsEvent::CHECKOUT_STARTED => ['checkout_started_count' => 1],
            AnalyticsEvent::PURCHASE_COMPLETED => ['purchase_completed_count' => 1],
            default => [],
        };

        if ($isNewVisitor) {
            $increments['visitors_count'] = 1;
        }

        if ($isNewSession) {
            $increments['sessions_count'] = 1;
        }

        $bounceDelta = $this->sessionBounceDelta($event);

        if ($bounceDelta !== 0) {
            $increments['bounce_sessions_count'] = $bounceDelta;
        }

        if (!empty($increments)) {
            foreach ($increments as $column => $value) {
                $metric->increment($column, $value);
            }
        }
    }

    private function incrementProductViewCountOnce(AnalyticsEvent $event): void
    {
        if (
            $event->event_type !== AnalyticsEvent::PRODUCT_VIEW
            || !$event->product_id
        ) {
            return;
        }

        $query = AnalyticsEvent::query()
            ->where('id', '<>', $event->id)
            ->where('event_type', AnalyticsEvent::PRODUCT_VIEW)
            ->where('product_id', $event->product_id)
            ->whereBetween('occurred_at', [
                $event->occurred_at->copy()->startOfDay(),
                $event->occurred_at->copy()->endOfDay(),
            ]);

        if ($event->visitor_id) {
            $query->where('visitor_id', $event->visitor_id);
        } elseif ($event->session_id) {
            $query->where('session_id', $event->session_id);
        } elseif ($event->ip_hash) {
            $query->where('ip_hash', $event->ip_hash);
        } else {
            return;
        }

        if ($query->exists()) {
            return;
        }

        Product::query()
            ->whereKey($event->product_id)
            ->increment('view_count');
    }

    private function sessionBounceDelta(AnalyticsEvent $event): int
    {
        if (!$event->session_id) {
            return 0;
        }

        $query = AnalyticsEvent::query()
            ->where('session_id', $event->session_id)
            ->whereBetween('occurred_at', [
                $event->occurred_at->copy()->startOfDay(),
                $event->occurred_at->copy()->endOfDay(),
            ]);

        $totalAfter = (clone $query)->count();
        $pageViewsAfter = (clone $query)
            ->where('event_type', AnalyticsEvent::PAGE_VIEW)
            ->count();

        $totalBefore = (clone $query)
            ->where('id', '<>', $event->id)
            ->count();
        $pageViewsBefore = (clone $query)
            ->where('id', '<>', $event->id)
            ->where('event_type', AnalyticsEvent::PAGE_VIEW)
            ->count();

        $wasBounce = $totalBefore === 1 && $pageViewsBefore === 1;
        $isBounce = $totalAfter === 1 && $pageViewsAfter === 1;

        return (int) $isBounce - (int) $wasBounce;
    }

    public function broadcastDashboardRefresh(): void
    {
        $this->broadcastSummary('dashboard_refresh', true);
    }

    private function broadcastSummary(?string $eventType = null, bool $forceRefreshDashboard = false): void
    {
        try {
            $shouldRefreshDashboard = $forceRefreshDashboard
                || in_array($eventType, [
                    AnalyticsEvent::CHECKOUT_STARTED,
                    AnalyticsEvent::PURCHASE_COMPLETED,
                ], true);

            broadcast(new AdminAnalyticsUpdated(
                $this->summary(30),
                $shouldRefreshDashboard
            ));
        } catch (\Throwable $e) {
            Log::warning('Broadcast admin analytics summary failed', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function isFirstVisitorOfDay(?string $visitorId, Carbon $date, int $currentEventId): bool
    {
        if (!$visitorId) {
            return false;
        }

        return !AnalyticsEvent::query()
            ->where('id', '<>', $currentEventId)
            ->where('visitor_id', $visitorId)
            ->whereBetween('occurred_at', [
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay(),
            ])
            ->exists();
    }

    private function isFirstSessionOfDay(?string $sessionId, Carbon $date, int $currentEventId): bool
    {
        if (!$sessionId) {
            return false;
        }

        return !AnalyticsEvent::query()
            ->where('id', '<>', $currentEventId)
            ->where('session_id', $sessionId)
            ->whereBetween('occurred_at', [
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay(),
            ])
            ->exists();
    }

    private function repeatPurchaseRate(Carbon $from): float
    {
        $buyers = Order::query()
            ->whereNotNull('user_id')
            ->whereIn('status', ['paid', 'processing', 'shipped', 'completed'])
            ->where('created_at', '>=', $from->copy()->startOfDay())
            ->select('user_id')
            ->groupBy('user_id')
            ->selectRaw('COUNT(*) as orders_count')
            ->get();

        $totalBuyers = $buyers->count();

        if ($totalBuyers === 0) {
            return 0;
        }

        return round(($buyers->where('orders_count', '>=', 2)->count() / $totalBuyers) * 100, 2);
    }

    private function percent(int $value, int $total): float
    {
        if ($total <= 0) {
            return 0;
        }

        return round(($value / $total) * 100, 2);
    }

    private function cleanString(?string $value, int $max): ?string
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        return mb_substr($value, 0, $max);
    }

    private function allowedEventTypes(): array
    {
        return [
            AnalyticsEvent::PAGE_VIEW,
            AnalyticsEvent::PRODUCT_VIEW,
            AnalyticsEvent::ADD_TO_CART,
            AnalyticsEvent::CHECKOUT_STARTED,
            AnalyticsEvent::PURCHASE_COMPLETED,
        ];
    }
}
