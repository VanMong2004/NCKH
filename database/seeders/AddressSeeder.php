<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Address;

class AddressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Address::create([
            'user_id' => 2,
            'full_name' => 'Nguyen Van A',
            'phone' => '0123456789',
            'province' => 'Can Tho',
            'district' => 'Ninh Kieu',
            'ward' => 'An Khanh',
            'address_line' => '123 ABC',
            'postal_code' => '900000',
            'is_default' => true,
        ]);
    }
}
