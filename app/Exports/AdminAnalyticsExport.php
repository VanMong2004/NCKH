<?php

namespace App\Exports;

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
                ['Chỉ số', 'Giá trị'],
                $this->overviewRows($overview)
            ),

            new AnalyticsTableSheet(
                'Top sản phẩm',
                ['STT', 'Tên sản phẩm', 'Slug', 'Số lượng bán', 'Doanh thu'],
                $this->topProductRows($topProducts)
            ),

            new AnalyticsTableSheet(
                'Doanh thu theo ngày',
                ['STT', 'Ngày', 'Doanh thu'],
                $this->salesChartRows($salesChart)
            ),
        ];
    }

    private function overviewRows(array $overview): array
    {
        return [
            ['Tổng số đơn hàng', $overview['total_orders'] ?? 0],
            ['Đơn hàng đã thanh toán', $overview['paid_orders'] ?? 0],
            ['Doanh thu', $this->money($overview['revenue'] ?? 0)],
            ['Tổng người dùng', $overview['total_users'] ?? 0],
        ];
    }

    private function topProductRows(array $products): array
    {
        return $this->mapRows($products, function ($item, $index) {
            return [
                $index + 1,
                $item['name'] ?? '',
                $item['slug'] ?? '',
                $item['sold'] ?? 0,
                $this->money($item['revenue'] ?? 0),
            ];
        });
    }

    private function salesChartRows(array $items): array
    {
        return $this->mapRows($items, function ($item, $index) {
            return [
                $index + 1,
                $item['date'] ?? '',
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
}