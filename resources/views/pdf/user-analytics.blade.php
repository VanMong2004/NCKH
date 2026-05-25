<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>User Analytics</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h1, h2 { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    </style>
</head>
<body>
    <h1>Báo cáo thống kê cá nhân</h1>

    <h2>Tổng quan đơn hàng</h2>
    <table>
        <tr>
            <th>Tổng đơn hàng</th>
            <td>{{ data_get($orders, 'total_orders', 0) }}</td>
        </tr>
        <tr>
            <th>Tổng chi tiêu</th>
            <td>{{ data_get($spending, 'total_spent', 0) }}</td>
        </tr>
    </table>

    <h2>Campaign</h2>
    <table>
        <tr>
            <th>Số campaign đã tham gia</th>
            <td>{{ data_get($campaigns, 'total_campaigns', 0) }}</td>
        </tr>
        <tr>
            <th>Campaign đang diễn ra</th>
            <td>{{ data_get($campaigns, 'active_campaigns', 0) }}</td>
        </tr>
        <tr>
            <th>Campaign đã hoàn thành</th>
            <td>{{ data_get($campaigns, 'completed_campaigns', 0) }}</td>
        </tr>
    </table>

    <h2>Đơn hàng gần đây</h2>
    <table>
        <thead>
            <tr>
                <th>Mã đơn</th>
                <th>Trạng thái</th>
                <th>Tổng tiền</th>
                <th>Cập nhật</th>
            </tr>
        </thead>
        <tbody>
            @foreach(data_get($orders, 'recent_orders', []) as $order)
                <tr>
                    <td>{{ data_get($order, 'order_code') }}</td>
                    <td>{{ data_get($order, 'status') }}</td>
                    <td>{{ data_get($order, 'total') }}</td>
                    <td>{{ data_get($order, 'updated_at') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>