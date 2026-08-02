<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hóa đơn GTGT mô phỏng {{ $request->order_code }}</title>

    <style>
        @page { margin: 24px 28px; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
        }

        .mock-badge {
            border: 2px solid #dc2626;
            color: #dc2626;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 12px;
            padding: 8px;
            text-align: center;
            text-transform: uppercase;
        }

        .header {
            margin-bottom: 18px;
            text-align: center;
        }

        .header h1 {
            color: #b91c1c;
            font-size: 22px;
            margin: 0;
            text-transform: uppercase;
        }

        .invoice-code {
            color: #374151;
            font-size: 12px;
            margin-top: 6px;
        }

        .section {
            border: 1px solid #e5e7eb;
            margin-bottom: 12px;
            padding: 10px;
        }

        .section-title {
            color: #b91c1c;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        table.data-table {
            border-collapse: collapse;
            width: 100%;
        }

        .data-table th {
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #7f1d1d;
            padding: 8px 6px;
            text-align: left;
        }

        .data-table td {
            border: 1px solid #e5e7eb;
            padding: 8px 6px;
        }

        .right {
            text-align: right;
        }

        .summary {
            margin-left: auto;
            margin-top: 14px;
            width: 340px;
        }

        .summary td {
            padding: 6px 0;
        }

        .total {
            border-top: 2px solid #b91c1c;
            color: #b91c1c;
            font-size: 15px;
            font-weight: bold;
        }

        .footer {
            color: #6b7280;
            font-size: 11px;
            margin-top: 22px;
            text-align: center;
        }
    </style>
</head>
<body>
    @php
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

    <div class="mock-badge">
        Hóa đơn GTGT mô phỏng - Không có giá trị pháp lý - Dùng cho kiểm thử nội bộ
    </div>

    <div class="header">
        <h1>Hóa đơn giá trị gia tăng</h1>
        <div class="invoice-code">
            Số hóa đơn: {{ $invoiceNo }} |
            Ngày lập: {{ optional($issuedAt)->format('d/m/Y H:i') }}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Đơn vị bán hàng</div>
        <div><strong>Tên đơn vị:</strong> CTUT UniShop</div>
        <div><strong>Mã số thuế:</strong> 0000000000</div>
        <div><strong>Địa chỉ:</strong> Trường Đại học Kỹ thuật - Công nghệ Cần Thơ</div>
    </div>

    <div class="section">
        <div class="section-title">Người mua hàng</div>
        <div><strong>Tên đơn vị/cá nhân:</strong> {{ $request->company_name }}</div>
        <div><strong>Mã số thuế:</strong> {{ $request->tax_code }}</div>
        <div><strong>Địa chỉ:</strong> {{ $request->company_address }}</div>
        <div><strong>Email nhận hóa đơn:</strong> {{ $request->invoice_email }}</div>
    </div>

    <div class="section">
        <div class="section-title">Thông tin đơn hàng</div>
        <div><strong>Mã đơn hàng:</strong> {{ $request->order_code }}</div>
        <div><strong>Thanh toán:</strong> {{ $paymentMethodText }} / {{ $paymentStatusText }}</div>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 42%;">Tên hàng hóa, dịch vụ</th>
                <th class="right">Đơn giá</th>
                <th class="right">SL</th>
                <th class="right">Thuế suất</th>
                <th class="right">Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                @php($lineTotal = (float) (($item->final_price ?? $item->price) * $item->quantity))
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td class="right">{{ number_format((float) ($item->final_price ?? $item->price), 0, ',', '.') }}đ</td>
                    <td class="right">{{ (int) $item->quantity }}</td>
                    <td class="right">0%</td>
                    <td class="right">{{ number_format($lineTotal, 0, ',', '.') }}đ</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary">
        <tr>
            <td>Cộng tiền hàng</td>
            <td class="right">{{ number_format((float) ($order->sub_total ?? 0), 0, ',', '.') }}đ</td>
        </tr>
        <tr>
            <td>Tiền thuế GTGT</td>
            <td class="right">0đ</td>
        </tr>
        <tr>
            <td>Giảm giá</td>
            <td class="right">-{{ number_format((float) ($order->discount_total ?? 0), 0, ',', '.') }}đ</td>
        </tr>
        <tr class="total">
            <td>Tổng tiền thanh toán</td>
            <td class="right">{{ number_format((float) ($order->grand_total ?? $order->total), 0, ',', '.') }}đ</td>
        </tr>
    </table>

    <div class="footer">
        PDF này chỉ dùng để kiểm thử nội bộ luồng xử lý hóa đơn đỏ. Khi tích hợp nhà cung cấp hóa đơn thật sau này, phần template/mock hiện tại sẽ được thay bằng luồng phát hành thực tế.
    </div>
</body>
</html>
