<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Analytics</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h1, h2 { margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
    </style>
</head>
<body>
    <h1>Báo cáo thống kê quản trị</h1>

    <h2>Tổng quan</h2>
    <table>
        <tr>
            <th>Tổng đơn hàng</th>
            <td>{{ data_get($overview, 'total_orders', 0) }}</td>
        </tr>
        <tr>
            <th>Đơn đã thanh toán</th>
            <td>{{ data_get($overview, 'paid_orders', 0) }}</td>
        </tr>
        <tr>
            <th>Doanh thu</th>
            <td>{{ data_get($overview, 'revenue', 0) }}</td>
        </tr>
        <tr>
            <th>Tổng người dùng</th>
            <td>{{ data_get($overview, 'total_users', 0) }}</td>
        </tr>
    </table>

    <h2>Top sản phẩm</h2>
    <table>
        <thead>
            <tr>
                <th>Sản phẩm</th>
                <th>Đã bán</th>
                <th>Doanh thu</th>
            </tr>
        </thead>
        <tbody>
            @foreach($top_products ?? [] as $item)
                <tr>
                    <td>{{ data_get($item, 'name') }}</td>
                    <td>{{ data_get($item, 'sold') }}</td>
                    <td>{{ data_get($item, 'revenue') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>