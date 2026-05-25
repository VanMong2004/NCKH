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
        return [
            new AnalyticsArraySheet('Tong quan', $this->data['overview'] ?? []),
            new AnalyticsArraySheet('Don hang', $this->data['orders'] ?? []),
            new AnalyticsArraySheet('Campaign', $this->data['campaigns'] ?? []),
            new AnalyticsArraySheet('Chi tieu', $this->data['spending'] ?? []),
            new AnalyticsArraySheet('Quan tam', $this->data['interests'] ?? []),
        ];
    }
}