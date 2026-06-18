<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class UserAnalyticsExport implements WithMultipleSheets
{
    public function __construct(
        protected array $data
    ) {}

    public function sheets(): array
    {
        $orders = $this->toArray($this->data['orders'] ?? []);
        $spending = $this->toArray($this->data['spending'] ?? []);
        $interests = $this->toArray($this->data['interests'] ?? []);
        $tracking = $this->toArray($this->data['tracking'] ?? []);

        return [
            new AnalyticsTableSheet(
                'Tổng quan',
                ['Chỉ số', 'Giá trị'],
                $this->overviewRows($orders, $spending, $interests, $tracking)
            ),

            new AnalyticsTableSheet(
                'Đơn hàng gần đây',
                ['STT', 'Mã đơn', 'Trạng thái', 'Tổng tiền', 'Cập nhật lần cuối'],
                $this->recentOrderRows($orders)
            ),

            new AnalyticsTableSheet(
                'Đơn hàng theo tháng',
                ['STT', 'Tháng', 'Số đơn hàng'],
                $this->monthlyOrderRows($orders)
            ),

            new AnalyticsTableSheet(
                'Trạng thái đơn hàng',
                ['STT', 'Trạng thái', 'Số lượng'],
                $this->orderStatusRows($orders)
            ),

            new AnalyticsTableSheet(
                'Chi tiêu theo tháng',
                ['STT', 'Tháng', 'Tổng chi tiêu'],
                $this->monthlySpendingRows($spending)
            ),

            new AnalyticsTableSheet(
                'Chi tiêu theo danh mục',
                ['STT', 'Danh mục', 'Tổng chi tiêu'],
                $this->spendingByCategoryRows($spending)
            ),

            new AnalyticsTableSheet(
                'Sản phẩm đã mua',
                ['STT', 'Tên sản phẩm', 'Slug', 'Số lượng đã mua'],
                $this->mostPurchasedRows($interests)
            ),

            new AnalyticsTableSheet(
                'Sản phẩm đã xem',
                ['STT', 'Tên sản phẩm', 'Slug', 'Thời gian xem'],
                $this->mostViewedRows($interests)
            ),

            new AnalyticsTableSheet(
                'Sản phẩm đã đánh giá',
                ['STT', 'Tên sản phẩm', 'Số sao', 'Nhận xét', 'Ngày đánh giá'],
                $this->reviewedProductRows($interests)
            ),
        ];
    }

    private function overviewRows(array $orders, array $spending, array $interests, array $tracking): array
    {
        return [
            ['Tổng số đơn hàng', $orders['total_orders'] ?? 0],
            ['Tổng tiền đã chi', $this->money($spending['total_spent'] ?? 0)],
            ['Sản phẩm đã mua', count($interests['most_purchased_products'] ?? [])],
            ['Sản phẩm đã xem gần đây', count($interests['most_viewed_products'] ?? [])],
            ['Sản phẩm đã đánh giá', count($interests['reviewed_products'] ?? [])],
            ['Đơn hàng đang theo dõi', count($tracking['orders'] ?? [])],
            ['Thời gian cập nhật', $tracking['last_updated_at'] ?? ''],
        ];
    }

    private function recentOrderRows(array $orders): array
    {
        return $this->mapRows($orders['recent_orders'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['order_code'] ?? '',
                $this->orderStatusLabel($item['status'] ?? ''),
                $this->money($item['total'] ?? 0),
                $item['updated_at'] ?? '',
            ];
        });
    }

    private function monthlyOrderRows(array $orders): array
    {
        return $this->mapRows($orders['monthly_orders'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['month'] ?? '',
                $item['total'] ?? 0,
            ];
        });
    }

    private function orderStatusRows(array $orders): array
    {
        return $this->mapRows($orders['status_breakdown'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $this->orderStatusLabel($item['status'] ?? ''),
                $item['total'] ?? 0,
            ];
        });
    }

    private function monthlySpendingRows(array $spending): array
    {
        return $this->mapRows($spending['monthly_spending'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['month'] ?? '',
                $this->money($item['total'] ?? 0),
            ];
        });
    }

    private function spendingByCategoryRows(array $spending): array
    {
        return $this->mapRows($spending['spending_by_category'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['category_name'] ?? 'Không phân loại',
                $this->money($item['total'] ?? 0),
            ];
        });
    }

    private function mostPurchasedRows(array $interests): array
    {
        return $this->mapRows($interests['most_purchased_products'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['name'] ?? '',
                $item['slug'] ?? '',
                $item['total_quantity'] ?? 0,
            ];
        });
    }

    private function mostViewedRows(array $interests): array
    {
        return $this->mapRows($interests['most_viewed_products'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['name'] ?? '',
                $item['slug'] ?? '',
                $item['viewed_at'] ?? '',
            ];
        });
    }

    private function reviewedProductRows(array $interests): array
    {
        return $this->mapRows($interests['reviewed_products'] ?? [], function ($item, $index) {
            return [
                $index + 1,
                $item['product_name'] ?? '',
                $item['rating'] ?? 0,
                $item['comment'] ?? '',
                $item['created_at'] ?? '',
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

    private function orderStatusLabel(?string $status): string
    {
        return match ($status) {
            'pending' => 'Chờ xử lý',
            'paid' => 'Đã thanh toán',
            'processing' => 'Đang xử lý',
            'shipped' => 'Đang giao hàng',
            'completed' => 'Hoàn thành',
            'cancelled' => 'Đã hủy',
            default => $status ?? '',
        };
    }
}