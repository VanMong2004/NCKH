<?php

namespace App\Services;

use App\Models\Order;
use App\Models\VatInvoiceRequest;

class VatInvoiceEmailWebhookService
{
    public function __construct(
        protected WebhookService $webhook
    ) {}

    public function sendCreated(Order $order, VatInvoiceRequest $request): void
    {
        $this->send($order, $request, 'created');
    }

    public function sendStatusUpdated(Order $order, VatInvoiceRequest $request, string $oldStatus): void
    {
        $this->send($order, $request, 'status_updated', $oldStatus);
    }

    private function send(Order $order, VatInvoiceRequest $request, string $action, ?string $oldStatus = null): void
    {
        $order->loadMissing([
            'user:id,name,email',
        ]);

        $request->loadMissing([
            'processor:id,name,email',
        ]);

        $recipientEmail = $request->invoice_email
            ?: $request->customer_email
            ?: $order->guest_email
            ?: $order->user?->email;

        $this->webhook->send('vat_invoice_email', [
            'type' => $action,
            'email_type' => 'vat_invoice_email',
            'action' => $action,
            'order_id' => $order->id,
            'order_code' => $order->order_code,
            'user_id' => $order->user_id,
            'recipient_email' => $recipientEmail,
            'customer_name' => $request->customer_name ?: $order->shipping_name ?: $order->guest_name ?: $order->user?->name,
            'customer_email' => $request->customer_email ?: $order->guest_email ?: $order->user?->email,
            'customer_phone' => $request->customer_phone ?: $order->shipping_phone ?: $order->guest_phone,
            'company_name' => $request->company_name,
            'tax_code' => $request->tax_code,
            'company_address' => $request->company_address,
            'invoice_email' => $request->invoice_email,
            'request_status' => $request->status,
            'old_status' => $oldStatus,
            'note' => $request->note,
            'admin_note' => $request->admin_note,
            'processed_by' => $request->processor?->name,
            'processed_by_email' => $request->processor?->email,
            'processed_at' => optional($request->processed_at)->toIso8601String(),
            'fulfilled_at' => optional($request->fulfilled_at)->toIso8601String(),
            'created_at' => optional($request->created_at)->toIso8601String(),
            'updated_at' => optional($request->updated_at)->toIso8601String(),
        ]);
    }
}
