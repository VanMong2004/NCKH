<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('payments')->insert([
            [
                'id' => 1,
                'order_id' => 1,
                'method' => 'vnpay',
                'status' => 'pending',
                'transaction_id' => null,
                'response_data' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'order_id' => 2,
                'method' => 'bank_transfer',
                'status' => 'success',
                'transaction_id' => 'TXN-20250426-001',
                'response_data' => json_encode([
                    'bank' => 'VCB',
                    'amount' => 200000,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
