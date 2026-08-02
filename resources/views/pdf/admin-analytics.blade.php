<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Báo cáo thống kê quản trị</title>

    <style>
        @page { margin: 24px 28px; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1f2937;
        }

        .header {
            text-align: center;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 3px solid #1f4e78;
        }

        .header h1 {
            margin: 0;
            color: #1f4e78;
            font-size: 22px;
            text-transform: uppercase;
        }

        .meta {
            margin-top: 6px;
            color: #6b7280;
            font-size: 11px;
        }

        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 15px;
            font-weight: bold;
            color: #1f4e78;
            padding-left: 8px;
            margin-bottom: 8px;
            border-left: 4px solid #1f4e78;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }

        .summary-table td {
            width: 25%;
            padding: 10px 6px;
            border: 1px solid #d9e2f3;
            background: #f8fbff;
            text-align: center;
        }

        .summary-label {
            font-size: 10px;
            color: #6b7280;
        }

        .summary-value {
            margin-top: 4px;
            font-size: 15px;
            font-weight: bold;
            color: #111827;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
        }

        .data-table th {
            background: #1f4e78;
            color: #ffffff;
            border: 1px solid #1f4e78;
            padding: 7px 6px;
            text-align: center;
        }

        .data-table td {
            border: 1px solid #d9e2f3;
            padding: 6px;
        }

        .data-table tr:nth-child(even) td {
            background: #f8fbff;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .money {
            color: #166534;
            font-weight: bold;
        }

        .empty {
            text-align: center;
            font-style: italic;
            color: #6b7280;
            padding: 12px;
        }

        .footer {
            position: fixed;
            bottom: -8px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 6px;
        }
    </style>
</head>

<body>
@php
    $money = fn ($value) => number_format((float) $value, 0, ',', '.') . ' đ';
@endphp

<div class="header">
    <h1>Báo cáo thống kê quản trị</h1>
    <div class="meta">
        Ngày xuất báo cáo: {{ $generated_at ?? now()->format('d/m/Y H:i') }}
    </div>
</div>

<div class="section">
    <div class="section-title">Tổng quan đơn hàng</div>

    <table class="summary-table">
        <tr>
            <td>
                <div class="summary-label">Tổng đơn hàng</div>
                <div class="summary-value">{{ data_get($overview, 'total_orders', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Đang chờ xử lý</div>
                <div class="summary-value">{{ data_get($overview, 'pending_orders', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Đơn đã thanh toán</div>
                <div class="summary-value">{{ data_get($overview, 'paid_orders', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Đơn hoàn thành</div>
                <div class="summary-value">{{ data_get($overview, 'completed_orders', 0) }}</div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="summary-label">Đơn đã hủy</div>
                <div class="summary-value">{{ data_get($overview, 'cancelled_orders', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Tổng người dùng</div>
                <div class="summary-value">{{ data_get($overview, 'total_users', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Tổng sản phẩm</div>
                <div class="summary-value">{{ data_get($overview, 'total_products', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Sản phẩm đang bán</div>
                <div class="summary-value">{{ data_get($overview, 'active_products', 0) }}</div>
            </td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">Doanh thu</div>

    <table class="summary-table">
        <tr>
            <td style="width: 50%;">
                <div class="summary-label">Doanh thu đơn đã thanh toán</div>
                <div class="summary-value money">{{ $money(data_get($overview, 'revenue', 0)) }}</div>
            </td>
            <td style="width: 50%;">
                <div class="summary-label">Doanh thu đơn hoàn thành</div>
                <div class="summary-value money">{{ $money(data_get($overview, 'completed_revenue', 0)) }}</div>
            </td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">Top sản phẩm bán chạy</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Sản phẩm</th>
            <th style="width: 70px;">Đã bán</th>
            <th style="width: 120px;">Doanh thu</th>
        </tr>
        </thead>
        <tbody>
        @forelse($top_products ?? [] as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($item, 'name', 'Không có tên') }}</td>
                <td class="text-center">{{ data_get($item, 'sold', 0) }}</td>
                <td class="text-right money">{{ $money(data_get($item, 'revenue', 0)) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4" class="empty">Không có dữ liệu sản phẩm</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Doanh thu 30 ngày gần nhất</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th style="width: 100px;">Ngày</th>
            <th style="width: 90px;">Số đơn</th>
            <th>Doanh thu</th>
        </tr>
        </thead>
        <tbody>
        @forelse($sales_chart ?? [] as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td class="text-center">{{ \Carbon\Carbon::parse(data_get($item, 'date'))->format('d/m/Y') }}</td>
                <td class="text-center">{{ data_get($item, 'orders_count', 0) }}</td>
                <td class="text-right money">{{ $money(data_get($item, 'revenue', 0)) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="4" class="empty">Không có dữ liệu doanh thu</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="footer">
    CTUT UniShop - Báo cáo được tạo tự động từ hệ thống quản trị
</div>

</body>
</html>
