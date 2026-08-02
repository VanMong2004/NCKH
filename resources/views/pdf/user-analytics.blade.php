<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Báo cáo thống kê cá nhân</title>

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
            vertical-align: middle;
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

    $statusLabel = function ($status) {
        return match ($status) {
            'pending' => 'Chờ xử lý',
            'paid' => 'Đã thanh toán',
            'processing' => 'Đang xử lý',
            'shipped' => 'Đang giao hàng',
            'completed' => 'Hoàn thành',
            'cancelled' => 'Đã hủy',
            default => $status ?? '',
        };
    };
@endphp

<div class="header">
    <h1>Báo cáo thống kê cá nhân</h1>
    <div class="meta">
        Ngày xuất báo cáo: {{ $generated_at ?? now()->format('d/m/Y H:i') }}
    </div>
</div>

<div class="section">
    <div class="section-title">Tổng quan</div>

    <table class="summary-table">
        <tr>
            <td>
                <div class="summary-label">Tổng đơn hàng</div>
                <div class="summary-value">{{ data_get($orders, 'total_orders', 0) }}</div>
            </td>
            <td>
                <div class="summary-label">Tổng chi tiêu</div>
                <div class="summary-value money">{{ $money(data_get($spending, 'total_spent', 0)) }}</div>
            </td>
            <td>
                <div class="summary-label">SP đã mua</div>
                <div class="summary-value">{{ count(data_get($interests, 'most_purchased_products', [])) }}</div>
            </td>
            <td>
                <div class="summary-label">Đơn đang theo dõi</div>
                <div class="summary-value">{{ count(data_get($tracking, 'orders', [])) }}</div>
            </td>
        </tr>
    </table>
</div>

<div class="section">
    <div class="section-title">Đơn hàng gần đây</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Mã đơn</th>
            <th>Trạng thái</th>
            <th>Tổng tiền</th>
            <th>Cập nhật</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($orders, 'recent_orders', []) as $index => $order)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($order, 'order_code') }}</td>
                <td class="text-center">{{ $statusLabel(data_get($order, 'status')) }}</td>
                <td class="text-right money">{{ $money(data_get($order, 'total', 0)) }}</td>
                <td class="text-center">{{ data_get($order, 'updated_at') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="empty">Không có đơn hàng gần đây</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Chi tiêu theo danh mục</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Danh mục</th>
            <th>Tổng chi tiêu</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($spending, 'spending_by_category', []) as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($item, 'category_name', 'Không phân loại') }}</td>
                <td class="text-right money">{{ $money(data_get($item, 'total', 0)) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="3" class="empty">Không có dữ liệu chi tiêu theo danh mục</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Sản phẩm đã mua nhiều nhất</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Tên sản phẩm</th>
            <th style="width: 90px;">Số lượng</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($interests, 'most_purchased_products', []) as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($item, 'name') }}</td>
                <td class="text-center">{{ data_get($item, 'total_quantity', 0) }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="3" class="empty">Không có dữ liệu sản phẩm đã mua</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Sản phẩm đã xem gần đây</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Tên sản phẩm</th>
            <th style="width: 120px;">Thời gian xem</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($interests, 'most_viewed_products', []) as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($item, 'name') }}</td>
                <td class="text-center">{{ data_get($item, 'viewed_at') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="3" class="empty">Không có dữ liệu sản phẩm đã xem</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Sản phẩm đã đánh giá</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Sản phẩm</th>
            <th style="width: 50px;">Sao</th>
            <th>Nhận xét</th>
            <th style="width: 110px;">Ngày</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($interests, 'reviewed_products', []) as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($item, 'product_name') }}</td>
                <td class="text-center">{{ data_get($item, 'rating', 0) }}/5</td>
                <td>{{ data_get($item, 'comment') }}</td>
                <td class="text-center">{{ data_get($item, 'created_at') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="empty">Không có dữ liệu đánh giá</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="section">
    <div class="section-title">Đơn hàng đang theo dõi</div>

    <table class="data-table">
        <thead>
        <tr>
            <th style="width: 35px;">STT</th>
            <th>Mã đơn</th>
            <th>Trạng thái</th>
            <th>Tổng tiền</th>
            <th>Cập nhật</th>
        </tr>
        </thead>
        <tbody>
        @forelse(data_get($tracking, 'orders', []) as $index => $order)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ data_get($order, 'order_code') }}</td>
                <td class="text-center">{{ $statusLabel(data_get($order, 'status')) }}</td>
                <td class="text-right money">{{ $money(data_get($order, 'total', 0)) }}</td>
                <td class="text-center">{{ data_get($order, 'updated_at') }}</td>
            </tr>
        @empty
            <tr>
                <td colspan="5" class="empty">Không có đơn hàng đang theo dõi</td>
            </tr>
        @endforelse
        </tbody>
    </table>
</div>

<div class="footer">
    CTUT UniShop - Báo cáo thống kê cá nhân được tạo tự động
</div>

</body>
</html>
