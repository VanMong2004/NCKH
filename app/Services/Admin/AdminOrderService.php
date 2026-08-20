<?php

namespace App\Services\Admin;

use RuntimeException;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\VatInvoiceRequest;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Services\VatInvoiceEmailWebhookService;

class AdminOrderService
{
    public function index(array $filters = []): array
    {
        $query = Order::query()
            ->with([
                'user:id,name,email',
                'user.addresses',
                'items:id,order_id,product_variant_id,quantity',
                'items.productVariant:id,product_id',
                'items.productVariant.product:id,name,slug',
                'items.productVariant.product.thumbnailImage:id,product_id,url,type,position',
                'items.productVariant.product.primaryImage:id,product_id,url,type,position',
                'payments:id,order_id,method,status,created_at',
                'vatInvoiceRequest:id,order_id,status,company_name,tax_code,invoice_email,admin_note,processed_by,processed_at,fulfilled_at,created_at',
            ]);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (!empty($filters['vat_invoice_status'])) {
            if ($filters['vat_invoice_status'] === 'none') {
                $query->whereDoesntHave('vatInvoiceRequest');
            } else {
                $query->whereHas('vatInvoiceRequest', function ($q) use ($filters) {
                    $q->where('status', $filters['vat_invoice_status']);
                });
            }
        }

        if (!empty($filters['keyword'])) {
            $keyword = $filters['keyword'];

            $query->where(function ($q) use ($keyword) {
                $q->where('order_code', 'like', "%{$keyword}%")
                    ->orWhere('shipping_name', 'like', "%{$keyword}%")
                    ->orWhere('shipping_phone', 'like', "%{$keyword}%")
                    ->orWhere('guest_phone', 'like', "%{$keyword}%")
                    ->orWhere('guest_email', 'like', "%{$keyword}%");
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from'] . ' 00:00:00');
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to'] . ' 23:59:59');
        }

        ($filters['sort'] ?? 'latest') === 'oldest'
            ? $query->oldest()
            : $query->latest();

        $perPage = min(max((int) ($filters['per_page'] ?? 10), 1), 100);

        $orders = $query->paginate($perPage);

        $orders->setCollection(
            $orders->getCollection()
                ->map(fn ($order) => $this->formatListItem($order))
        );

        return [
            'success' => true,
            'message' => 'Lấy danh sách đơn hàng thành công',
            'data' => $orders,
        ];
    }

    public function show(int $id): array
    {
        $order = Order::with([
            'user:id,name,email,phone',
            'user.addresses',
            'items.productVariant.product.thumbnailImage:id,product_id,url,type,position',
            'items.productVariant.product.primaryImage:id,product_id,url,type,position',
            'payments',
            'statusHistories.changer:id,name,email',
            'vatInvoiceRequest.processor:id,name,email',
        ])->find($id);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        return [
            'success' => true,
            'message' => 'Lấy chi tiết đơn hàng thành công',
            'data' => $this->formatDetail($order),
        ];
    }

    public function updateStatus(int $id, array $data, $admin = null): array
    {
        return DB::transaction(function () use ($id, $data, $admin) {
            $order = Order::with([
                'items.productVariant',
                'payments',
            ])
                ->lockForUpdate()
                ->find($id);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            $oldStatus = $order->status;
            $newStatus = $data['status'];

            $this->validateStatusTransition(
                $order,
                $newStatus
            );

            if ($newStatus === 'cancelled') {
                $this->cancelOrder($order, $data['cancel_reason'] ?? 'admin_cancelled');
            } elseif ($newStatus === 'completed') {
                $this->completeOrder($order);
            } else {
                $order->update([
                    'status' => $newStatus,
                ]);
                app(NotificationService::class)
                    ->order(
                        $order->fresh(),
                        $newStatus
                    );
            }

            $this->createStatusHistory(
                $order,
                $oldStatus,
                $newStatus,
                $admin?->id,
                $data['note'] ?? ($data['cancel_reason'] ?? null)
            );

            app(\App\Services\Analytics\AnalyticsEventService::class)
                ->broadcastDashboardRefresh();

            return [
                'success' => true,
                'message' => 'Cập nhật trạng thái đơn hàng thành công',
                'data' => $this->formatDetail($order->fresh([
                    'user:id,name,email,phone',
                    'user.addresses',
                    'items.productVariant.product.thumbnailImage:id,product_id,url,type,position',
                    'items.productVariant.product.primaryImage:id,product_id,url,type,position',
                    'payments',
                    'statusHistories.changer:id,name,email',
                    'vatInvoiceRequest.processor:id,name,email',
                ])),
            ];
        });
    }

    public function updateVatInvoiceStatus(int $id, array $data, $admin = null): array
    {
        return DB::transaction(function () use ($id, $data, $admin) {
            $order = Order::with([
                'user:id,name,email,phone',
                'user.addresses',
                'items.productVariant.product.thumbnailImage:id,product_id,url,type,position',
                'items.productVariant.product.primaryImage:id,product_id,url,type,position',
                'payments',
                'statusHistories.changer:id,name,email',
                'vatInvoiceRequest.processor:id,name,email',
            ])->find($id);

            if (!$order) {
                throw new RuntimeException('Đơn hàng không tồn tại', 404);
            }

            /** @var VatInvoiceRequest|null $request */
            $request = VatInvoiceRequest::query()
                ->where('order_id', $order->id)
                ->lockForUpdate()
                ->first();

            if (!$request) {
                throw new RuntimeException('Đơn hàng này chưa có yêu cầu hóa đơn giá trị gia tăng', 404);
            }

            $oldStatus = $request->status;
            $newStatus = $data['status'];
            $adminNote = trim((string) ($data['admin_note'] ?? ''));

            $allowedTransitions = [
                'pending' => ['processing', 'rejected'],
                'processing' => ['fulfilled', 'rejected'],
                'fulfilled' => [],
                'rejected' => [],
            ];

            if (!in_array($newStatus, $allowedTransitions[$oldStatus] ?? [], true)) {
                throw new RuntimeException('Không thể chuyển trạng thái hóa đơn giá trị gia tăng theo luồng hiện tại', 409);
            }

            if ($newStatus === 'rejected' && $adminNote === '') {
                throw new RuntimeException('Vui lòng nhập lý do từ chối hóa đơn giá trị gia tăng', 422);
            }

            $payload = [
                'status' => $newStatus,
                'admin_note' => $adminNote !== '' ? $adminNote : $request->admin_note,
            ];

            if ($newStatus === 'processing') {
                $payload['processed_by'] = $admin?->id;
                $payload['processed_at'] = now();
            }

            if ($newStatus === 'fulfilled') {
                $payload['processed_by'] = $admin?->id;
                $payload['processed_at'] = $request->processed_at ?: now();
                $payload['fulfilled_at'] = now();
            }

            if ($newStatus === 'rejected') {
                $payload['processed_by'] = $admin?->id;
                $payload['processed_at'] = $request->processed_at ?: now();
                $payload['fulfilled_at'] = null;
            }

            $request->update($payload);
            $request = $request->fresh(['processor:id,name,email']);

            app(VatInvoiceEmailWebhookService::class)->sendStatusUpdated(
                $order,
                $request,
                $oldStatus
            );

            $order->setRelation('vatInvoiceRequest', $request);

            return [
                'success' => true,
                'message' => 'Cập nhật trạng thái hóa đơn giá trị gia tăng thành công',
                'data' => $this->formatDetail($order),
            ];
        });
    }

    private function validateStatusTransition(Order $order, string $next): void
    {
        $allowed = $this->getAllowedNextStatuses($order);

        if (!in_array($next, $allowed[$order->status] ?? [], true)) {
            throw new RuntimeException(
                "Không thể chuyển trạng thái từ {$order->status} sang {$next}",
                400
            );
        }
    }

    private function getAllowedNextStatuses(Order $order): array
    {
        return [
            'pending' => [
                'processing',
                'cancelled',
            ],
            'processing' => [
                'awaiting_receipt',
                'cancelled',
            ],
            'awaiting_receipt' => [
                'completed',
                'cancelled',
            ],
            'completed' => [],
            'cancelled' => [],
        ];
    }

    private function cancelOrder(Order $order, string $reason): void
    {
        if (
            in_array($order->status, [
                'pending',
                'processing',
                'awaiting_receipt',
            ], true)
        ) {
            app(OrderReleaseService::class)
                ->release($order);
        }

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        if ($payment) {
            if ($payment->status === 'unpaid') {
                $payment->update([
                    'status' => 'failed',
                ]);
            }
        }

        $order->update([
            'status' => 'cancelled',
            'cancel_reason' => $reason,
            'payment_status' => $order->payment_status === 'paid' ? 'paid' : 'failed',
        ]);

        app(NotificationService::class)
            ->order(
                $order->fresh(),
                'cancelled'
            );
    }

    private function completeOrder(Order $order): void
    {
        if ($order->status !== 'awaiting_receipt') {
            throw new RuntimeException('Chỉ được hoàn tất đơn hàng đang chờ nhận hàng', 400);
        }

        foreach ($order->items as $item) {
            if (!$item->product_variant_id) {
                continue;
            }

            $variant = ProductVariant::lockForUpdate()
                ->find($item->product_variant_id);

            if (!$variant) {
                continue;
            }

            $releaseQuantity = min(
                (int) $variant->reserved_stock,
                (int) $item->quantity
            );

            $before = clone $variant;

            if ($releaseQuantity > 0) {
                $variant->decrement('reserved_stock', $releaseQuantity);
            }

            $variant->increment('sold_stock', $item->quantity);

            $after = $variant->fresh();

            app(\App\Services\Admin\InventoryHistoryService::class)->record(
                $before,
                $after,
                'order_completed',
                (int) $item->quantity,
                $order->id,
                auth()->id(),
                'Hoàn tất đơn hàng, chuyển giữ chỗ sang đã bán'
            );
        }

        $order->update([
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        app(NotificationService::class)
            ->order(
                $order->fresh(),
                'completed'
            );

        app(\App\Services\Analytics\AnalyticsEventService::class)
            ->trackPurchaseCompletedForOrder($order->fresh());

        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        if (
            $payment &&
            $payment->status === 'unpaid'
        ) {
            $payment->update([
                'status' => 'paid',
            ]);
        }
    }

    private function formatListItem(Order $order): array
    {
        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        $firstItem = $order->items->first();

        $thumbnail = $this->productThumbnail($firstItem?->productVariant?->product);

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'customer' => [
                'user_id' => $order->user_id,
                'name' => $order->user?->name ?? $order->guest_name,
                'email' => $order->user?->email ?? $order->guest_email,
                'phone' => $order->shipping_phone,
            ],
            'status' => $order->status,
            'payment_status' => $order->payment_status ?? $payment?->status ?? 'unpaid',
            'fulfillment_method' => $order->fulfillment_method,
            'payment_method' => $payment?->method,
            'vat_invoice_request' => $this->formatVatInvoiceRequest($order),
            'thumbnail' => $thumbnail,
            'item_count' => $order->items->sum('quantity'),
            'total' => (float) $order->total,
            'allowed_next_statuses' => $this->getAllowedNextStatuses($order)[$order->status] ?? [],
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,
            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
        ];
    }

    private function formatDetail(Order $order): array
    {
        $payment = $order->payments
            ->sortByDesc('created_at')
            ->first();

        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'fulfillment_method' => $order->fulfillment_method,
            'status_histories' => $order->statusHistories
                ->sortBy('created_at')
                ->map(fn ($history) => [
                    'id' => $history->id,
                    'old_status' => $history->old_status,
                    'new_status' => $history->new_status,
                    'note' => $history->note,
                    'changed_by' => $history->changer ? [
                        'id' => $history->changer->id,
                        'name' => $history->changer->name,
                        'email' => $history->changer->email,
                    ] : null,
                    'created_at' => optional($history->created_at)->format('d/m/Y H:i'),
                ])
                ->values(),
            'created_at' => optional($order->created_at)->format('d/m/Y H:i'),
            'expired_at' => optional($order->expired_at)->format('d/m/Y H:i'),
            'cancel_reason' => $order->cancel_reason,

            'customer' => [
                'user_id' => $order->user_id,
                'name' => $order->user?->name ?? $order->guest_name,
                'email' => $order->user?->email ?? $order->guest_email,
                'phone' => $order->shipping_phone,
            ],

            'receiver' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->resolvedShippingAddress(),
            ],

            'payment' => $payment ? [
                'id' => $payment->id,
                'method' => $payment->method,
                'status' => $payment->status,
                'amount' => (float) $payment->amount,
                'transaction_id' => $payment->transaction_id,
            ] : null,
            'vat_invoice_request' => $this->formatVatInvoiceRequest($order),
            'allowed_next_statuses' => $this->getAllowedNextStatuses($order)[$order->status] ?? [],

            'summary' => [
                'sub_total' => (float) $order->sub_total,
                'shipping_fee' => (float) $order->shipping_fee,
                'discount' => (float) $order->discount_total,
                'grand_total' => (float) $order->grand_total,
                'total' => (float) $order->total,
            ],

            'items' => $order->items->map(function ($item) {
                $variant = $item->productVariant;
                $product = $variant?->product;

                return [
                    'id' => $item->id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product_name,
                    'thumbnail' => $this->productThumbnail($product),
                    'variant' => $item->variant_snapshot,
                    'price' => (float) $item->final_price,
                    'original_price' => (float) $item->original_price,
                    'discount_amount' => (float) $item->discount_amount,
                    'final_price' => (float) $item->final_price,
                    'quantity' => (int) $item->quantity,
                    'total' => (float) ($item->final_price * $item->quantity),
                    'promotion' => $item->promotion_id
                        ? $item->promotion_snapshot
                        : null,
                ];
            })->values(),
        ];
    }

    private function createStatusHistory(
        Order $order,
        ?string $oldStatus,
        string $newStatus,
        ?int $changedBy = null,
        ?string $note = null
    ): void {
        \App\Models\OrderStatusHistory::create([
            'order_id' => $order->id,
            'changed_by' => $changedBy,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'note' => $note,
        ]);
    }

    private function productThumbnail($product): ?string
    {
        if (!$product) {
            return null;
        }

        return $product->thumbnailImage?->url
            ?? $product->primaryImage?->url;
    }

    private function formatVatInvoiceRequest(Order $order): ?array
    {
        $request = $order->vatInvoiceRequest;

        if (!$request) {
            return null;
        }

        return [
            'id' => $request->id,
            'status' => $request->status,
            'company_name' => $request->company_name,
            'tax_code' => $request->tax_code,
            'invoice_email' => $request->invoice_email,
            'admin_note' => $request->admin_note,
            'processed_at' => optional($request->processed_at)->format('d/m/Y H:i'),
            'fulfilled_at' => optional($request->fulfilled_at)->format('d/m/Y H:i'),
            'created_at' => optional($request->created_at)->format('d/m/Y H:i'),
            'processed_by' => $request->processor ? [
                'id' => $request->processor->id,
                'name' => $request->processor->name,
                'email' => $request->processor->email,
            ] : null,
        ];
    }
}
