<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithTitle;

class AnalyticsArraySheet implements FromCollection, WithTitle
{
    public function __construct(
        protected string $title,
        protected mixed $data
    ) {}

    public function collection()
    {
        return collect($this->flattenData($this->data));
    }

    public function title(): string
    {
        return mb_substr($this->title, 0, 31);
    }

    private function flattenData($data, string $prefix = ''): array
    {
        $rows = [];

        if ($data instanceof Collection) {
            $data = $data->toArray();
        }

        if (is_object($data)) {
            $data = json_decode(json_encode($data), true);
        }

        if (!is_array($data)) {
            return [
                [
                    'key' => $prefix ?: 'value',
                    'value' => $data,
                ],
            ];
        }

        foreach ($data as $key => $value) {
            $currentKey = $prefix === ''
                ? (string) $key
                : $prefix . '.' . $key;

            if (is_array($value) || $value instanceof Collection || is_object($value)) {
                $rows = array_merge(
                    $rows,
                    $this->flattenData($value, $currentKey)
                );
            } else {
                $rows[] = [
                    'key' => $currentKey,
                    'value' => $value,
                ];
            }
        }

        return $rows;
    }
}