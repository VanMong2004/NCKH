<?php

namespace App\Exports;

use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AdminAnalyticsExport implements WithMultipleSheets
{
    public function __construct(
        protected array $data
    ) {}

    public function sheets(): array
    {
        $overview = $this->toArray($this->data['overview'] ?? []);
        $topProducts = $this->toArray($this->data['top_products'] ?? []);
        $salesChart = $this->toArray($this->data['sales_chart'] ?? []);

        return [
            new AnalyticsTableSheet(
                'Tổng quan',
                ['Nhóm', 'Chỉ số', 'Giá trị'],
                $this->overviewRows($overview)
            ),

            new AnalyticsTableSheet(
                'Top sản phẩm',
                ['STT', 'ID', 'Tên sản phẩm', 'Slug', 'Số lượng bán', 'Doanh thu'],
                $this->topProductRows($topProducts)
            ),

            new AnalyticsTableSheet(
                'Doanh thu 30 ngày',
                ['STT', 'Ngày', 'Số đơn hàng', 'Doanh thu'],
                $this->salesChartRows($salesChart)
            ),
        ];
    }

    private function overviewRows(array $overview): array
    {
        return [
            ['Đơn hàng', 'Tổng số đơn hàng', $overview['total_orders'] ?? 0],
            ['Đơn hàng', 'Đơn đang chờ xử lý', $overview['pending_orders'] ?? 0],
            ['Đơn hàng', 'Đơn đã thanh toán', $overview['paid_orders'] ?? 0],
            ['Đơn hàng', 'Đơn đã hủy', $overview['cancelled_orders'] ?? 0],
            ['Đơn hàng', 'Đơn hoàn thành', $overview['completed_orders'] ?? 0],

            ['Doanh thu', 'Doanh thu đơn đã thanh toán', $this->money($overview['revenue'] ?? 0)],
            ['Doanh thu', 'Doanh thu đơn hoàn thành', $this->money($overview['completed_revenue'] ?? 0)],

            ['Người dùng', 'Tổng người dùng', $overview['total_users'] ?? 0],

            ['Sản phẩm', 'Tổng sản phẩm', $overview['total_products'] ?? 0],
            ['Sản phẩm', 'Sản phẩm đang bán', $overview['active_products'] ?? 0],

            ['Hệ thống', 'Ngày xuất báo cáo', $this->data['generated_at'] ?? now()->format('d/m/Y H:i')],
        ];
    }

    private function topProductRows(array $products): array
    {
        return $this->mapRows($products, function ($item, $index) {
            return [
                $index + 1,
                $item['id'] ?? '',
                $item['name'] ?? '',
                $item['slug'] ?? '',
                (int) ($item['sold'] ?? 0),
                $this->money($item['revenue'] ?? 0),
            ];
        });
    }

    private function salesChartRows(array $items): array
    {
        return $this->mapRows($items, function ($item, $index) {
            return [
                $index + 1,
                $this->formatDate($item['date'] ?? null),
                (int) ($item['orders_count'] ?? 0),
                $this->money($item['revenue'] ?? 0),
            ];
        });
    }

    private function mapRows($items, callable $callback): array
    {
        $items = $this->toArray($items);

        if (empty($items)) {
            return [];
        }

        return collect($items)
            ->values()
            ->map(fn ($item, $index) => $callback($this->toArray($item), $index))
            ->toArray();
    }

    private function toArray($data): array
    {
        if ($data instanceof \Illuminate\Support\Collection) {
            return $data->toArray();
        }

        if (is_object($data)) {
            return json_decode(json_encode($data), true) ?? [];
        }

        return is_array($data) ? $data : [];
    }

    private function money($value): string
    {
        return number_format((float) $value, 0, ',', '.') . ' đ';
    }

    private function formatDate($date): string
    {
        if (!$date) {
            return '';
        }

        return Carbon::parse($date)->format('d/m/Y');
    }
}