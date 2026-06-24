<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $addresses = [
            'nhat.b2200001@ctuet.edu.vn' => ['Bùi Hữu Nhật', '0901000002', 'Cần Thơ', 'Ninh Kiều', 'An Khánh', 'Ký túc xá CTUT, khu A'],
            'anh.b2200102@ctuet.edu.vn' => ['Nguyễn Minh Anh', '0901000003', 'Cần Thơ', 'Ninh Kiều', 'Xuân Khánh', 'Đường 3/2, gần cổng trường'],
            'bao.b2300221@ctuet.edu.vn' => ['Trần Quốc Bảo', '0901000004', 'Cần Thơ', 'Cái Răng', 'Hưng Phú', 'Khu dân cư Hưng Phú'],
            'vy.b2400305@ctuet.edu.vn' => ['Lê Thảo Vy', '0901000005', 'Cần Thơ', 'Ninh Kiều', 'An Bình', 'Hẻm 51 đường 3/2'],
            'han.b2500411@ctuet.edu.vn' => ['Phạm Gia Hân', '0901000006', 'Cần Thơ', 'Bình Thủy', 'Long Hòa', 'Đường Võ Văn Kiệt'],
            'nam.b2300440@ctuet.edu.vn' => ['Đặng Hoàng Nam', '0901000007', 'Cần Thơ', 'Ninh Kiều', 'Hưng Lợi', 'Đường Mậu Thân'],
        ];

        foreach ($addresses as $email => $data) {
            $user = User::where('email', $email)->first();

            if (!$user) {
                continue;
            }

            Address::create([
                'user_id' => $user->id,
                'full_name' => $data[0],
                'phone' => $data[1],
                'province' => $data[2],
                'district' => $data[3],
                'ward' => $data[4],
                'address_line' => $data[5],
                'postal_code' => '900000',
                'is_default' => true,
            ]);
        }
    }
}