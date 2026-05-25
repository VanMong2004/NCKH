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
        return [
            new AnalyticsArraySheet('Tong quan', $this->data['overview'] ?? []),
            new AnalyticsArraySheet('Top san pham', $this->data['top_products'] ?? []),
            new AnalyticsArraySheet('Bieu do doanh thu', $this->data['sales_chart'] ?? []),
        ];
    }
}