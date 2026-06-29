<?php

namespace App\Services;

use App\Models\Order;
use App\Models\VatInvoiceRequest;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class VatInvoiceRequestService
{
    public function showForUser($user, int $orderId): ?array
    {
        $order = $this->resolveUserOrder($user, $orderId);

        return $this->format(
            VatInvoiceRequest::where('order_id', $order->id)->first()
        );
    }

    public function showForGuest($user, ?string $guestToken, string $orderCode): ?array
    {
        $order = $this->resolveGuestOrder($user, $guestToken, $orderCode);

        return $this->format(
            VatInvoiceRequest::where('order_id', $order->id)->first()
        );
    }

    public function createForUser($user, int $orderId, array $data): array
    {
        $order = $this->resolveUserOrder($user, $orderId);

        return $this->create($order, $data);
    }

    public function createForGuest($user, ?string $guestToken, string $orderCode, array $data): array
    {
        $order = $this->resolveGuestOrder($user, $guestToken, $orderCode);

        return $this->create($order, $data);
    }

    private function resolveUserOrder($user, int $orderId): Order
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        $order = Order::where('user_id', $user->id)->find($orderId);

        if (!$order) {
            throw new RuntimeException('Đơn hàng không tồn tại', 404);
        }

        return $order;
    }

    private function resolveGuestOrder($user, ?string $guestToken, string $orderCode): Order
    {
        $order = Order::where('order_code', $orderCode)->first();

        if (!$order) {
            throw new RuntimeException('Không tìm thấy đơn hàng', 404);
        }

        if ($user) {
            if ((int) $order->user_id !== (int) $user->id) {
                throw new RuntimeException('Bạn không có quyền xem đơn hàng này', 403);
            }
        } elseif (!$guestToken || $order->guest_token !== $guestToken) {
            throw new RuntimeException('Không đủ thông tin để yêu cầu hóa đơn đỏ', 401);
        }

        return $order;
    }

    private function create(Order $order, array $data): array
    {
        return DB::transaction(function () use ($order, $data) {
            $existing = VatInvoiceRequest::where('order_id', $order->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $this->format($existing);
            }

            $invoiceEmail = $data['invoice_email'];

            $request = VatInvoiceRequest::create([
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'order_code' => $order->order_code,
                'customer_name' => $order->shipping_name ?: $order->guest_name ?: $data['company_name'],
                'customer_email' => $order->guest_email ?: $order->user?->email ?: $invoiceEmail,
                'customer_phone' => $order->shipping_phone ?: $order->guest_phone,
                'company_name' => $data['company_name'],
                'tax_code' => $data['tax_code'],
                'company_address' => $data['company_address'],
                'invoice_email' => $invoiceEmail,
                'status' => 'pending',
                'note' => $data['note'] ?? null,
            ]);

            return $this->format($request);
        });
    }

    private function format(?VatInvoiceRequest $request): ?array
    {
        if (!$request) {
            return null;
        }

        return [
            'id' => $request->id,
            'order_id' => $request->order_id,
            'order_code' => $request->order_code,
            'customer_name' => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $request->customer_phone,
            'company_name' => $request->company_name,
            'tax_code' => $request->tax_code,
            'company_address' => $request->company_address,
            'invoice_email' => $request->invoice_email,
            'status' => $request->status,
            'note' => $request->note,
            'admin_note' => $request->admin_note,
            'issued_at' => optional($request->issued_at)->format('d/m/Y H:i'),
            'created_at' => optional($request->created_at)->format('d/m/Y H:i'),
        ];
    }
}
