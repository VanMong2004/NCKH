<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Bill {{ $order->order_code }}</title>

    <style>
        @page { margin: 24px 28px; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1f2937;
        }

        .header {
            border-bottom: 3px solid #1f4e78;
            margin-bottom: 18px;
            padding-bottom: 12px;
            text-align: center;
        }

        .header h1 {
            color: #1f4e78;
            font-size: 22px;
            margin: 0;
            text-transform: uppercase;
        }

        .muted {
            color: #6b7280;
        }

        .grid {
            width: 100%;
            margin-bottom: 16px;
        }

        .grid td {
            vertical-align: top;
            width: 50%;
        }

        .box {
            border: 1px solid #d9e2f3;
            padding: 10px;
        }

        .box-title {
            color: #1f4e78;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        table.data-table {
            border-collapse: collapse;
            margin-top: 10px;
            width: 100%;
        }

        .data-table th {
            background: #1f4e78;
            color: #ffffff;
            font-size: 11px;
            padding: 8px 6px;
            text-align: left;
        }

        .data-table td {
            border: 1px solid #d9e2f3;
            padding: 8px 6px;
        }

        .right {
            text-align: right;
        }

        .summary {
            margin-left: auto;
            margin-top: 14px;
            width: 320px;
        }

        .summary td {
            padding: 6px 0;
        }

        .total {
            border-top: 2px solid #1f4e78;
            color: #1f4e78;
            font-size: 15px;
            font-weight: bold;
        }

        .note {
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 11px;
            margin-top: 24px;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    @php
        $orderStatusText = [
            'pending' => 'Chờ xác nhận',
            'processing' => 'Đang chuẩn bị',
            'awaiting_receipt' => $order->fulfillment_method === 'pickup' ? 'Sẵn sàng nhận tại phòng' : 'Đang giao',
            'completed' => 'Hoàn thành',
            'cancelled' => 'Đã hủy',
        ][$order->status] ?? $order->status;

        $paymentMethodText = [
            'cod' => 'Thanh toán khi nhận hàng',
            'mock_bank' => 'Chuyển khoản ngân hàng',
            'cash_on_pickup' => 'Thanh toán trực tiếp khi nhận tại phòng',
            'bank_transfer' => 'Chuyển khoản ngân hàng',
            'banking' => 'Chuyển khoản ngân hàng',
            'mock' => 'Chuyển khoản ngân hàng',
        ][$payment?->method] ?? ($payment?->method ?: '---');

        $paymentStatusText = [
            'unpaid' => 'Chưa thanh toán',
            'paid' => 'Đã thanh toán',
            'failed' => 'Thanh toán thất bại',
            'refunded' => 'Đã hoàn tiền',
            'pending' => 'Chưa thanh toán',
            'processing' => 'Đang xử lý',
            'success' => 'Đã thanh toán',
            'cancelled' => 'Đã hủy',
        ][$payment?->status] ?? ($payment?->status ?: 'Chưa thanh toán');
    @endphp

    <div class="header">
        <h1>Phiếu thanh toán</h1>
        <div class="muted">CTUT UniShop - Bill đơn hàng {{ $order->order_code }}</div>
    </div>

    <table class="grid">
        <tr>
            <td style="padding-right: 8px;">
                <div class="box">
                    <div class="box-title">Thông tin đơn hàng</div>
                    <div><strong>Mã đơn:</strong> {{ $order->order_code }}</div>
                    <div><strong>Ngày đặt:</strong> {{ optional($order->created_at)->format('d/m/Y H:i') }}</div>
                    <div><strong>Ngày xuất bill:</strong> {{ optional($issuedAt)->format('d/m/Y H:i') }}</div>
                    <div><strong>Trạng thái đơn:</strong> {{ $orderStatusText }}</div>
                </div>
            </td>
            <td style="padding-left: 8px;">
                <div class="box">
                    <div class="box-title">Người nhận</div>
                    <div><strong>Họ tên:</strong> {{ $order->shipping_name ?: '---' }}</div>
                    <div><strong>Số điện thoại:</strong> {{ $order->shipping_phone ?: '---' }}</div>
                    <div><strong>Địa chỉ:</strong> {{ $order->resolvedShippingAddress() ?: '---' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="box">
        <div class="box-title">Thanh toán</div>
        <div><strong>Phương thức:</strong> {{ $paymentMethodText }}</div>
        <div><strong>Trạng thái:</strong> {{ $paymentStatusText }}</div>
        <div><strong>Mã giao dịch:</strong> {{ $payment?->transaction_id ?: '---' }}</div>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 42%;">Sản phẩm</th>
                <th>Phân loại</th>
                <th class="right">Đơn giá</th>
                <th class="right">SL</th>
                <th class="right">Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>
                        @php($variant = $item->variant_snapshot ?: [])
                        {{ collect([$variant['sku'] ?? null, $variant['size'] ?? null, $variant['color'] ?? null])->filter()->implode(' / ') ?: '---' }}
                    </td>
                    <td class="right">{{ number_format((float) ($item->final_price ?? $item->price), 0, ',', '.') }}đ</td>
                    <td class="right">{{ (int) $item->quantity }}</td>
                    <td class="right">{{ number_format((float) (($item->final_price ?? $item->price) * $item->quantity), 0, ',', '.') }}đ</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary">
        <tr>
            <td>Tạm tính</td>
            <td class="right">{{ number_format((float) ($order->sub_total ?? 0), 0, ',', '.') }}đ</td>
        </tr>
        <tr>
            <td>Phí vận chuyển</td>
            <td class="right">{{ number_format((float) ($order->shipping_fee ?? 0), 0, ',', '.') }}đ</td>
        </tr>
        <tr>
            <td>Giảm giá</td>
            <td class="right">-{{ number_format((float) ($order->discount_total ?? 0), 0, ',', '.') }}đ</td>
        </tr>
        <tr class="total">
            <td>Tổng cộng</td>
            <td class="right">{{ number_format((float) ($order->grand_total ?? $order->total), 0, ',', '.') }}đ</td>
        </tr>
    </table>

    <div class="note">
        Phiếu này dùng để xác nhận thông tin thanh toán nội bộ của CTUT UniShop. Đây không phải hóa đơn giá trị gia tăng.
    </div>
</body>
</html>
