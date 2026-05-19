<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;

class AnalyticsExport implements FromArray
{
    protected $data;

    public function __construct(
        $data
    ){
        $this->data = $data;
    }

    public function array(): array
    {
        $rows=[];

        $rows[]=['OVERVIEW'];

        foreach(
            $this->data['overview']
            as $k=>$v
        ){
            $rows[]=[
                $k,
                $v
            ];
        }

        $rows[]=[];

        $rows[]=[
            'TOP PRODUCTS'
        ];

        foreach(
            $this->data['top_products']
            as $p
        ){

            $rows[]=[

                $p['name'],
                $p['sold'],
                $p['revenue']
            ];
        }

        return $rows;
    }
}