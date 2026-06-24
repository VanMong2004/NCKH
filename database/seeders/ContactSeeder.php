<?php

namespace Database\Seeders;

use App\Models\Contact;
use Illuminate\Database\Seeder;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        Contact::create([
            'full_name' => 'Nguyễn Minh Anh',
            'email' => 'anh@gmail.com',
            'phone' => '0909999999',
            'subject' => 'Hỏi về đổi size áo',
            'message' => 'Cho em hỏi thủ tục đổi size áo.',
            'status' => 'resolved',
        ]);

        Contact::create([
            'full_name' => 'Trần Quốc Bảo',
            'email' => 'bao@gmail.com',
            'phone' => '0908888888',
            'subject' => 'Hỏi về vận chuyển',
            'message' => 'Bao lâu nhận được hàng?',
            'status' => 'processing',
        ]);

        Contact::create([
            'full_name' => 'Lê Thảo Vy',
            'email' => 'vy@gmail.com',
            'phone' => '0907777777',
            'subject' => 'Liên hệ hỗ trợ',
            'message' => 'Không thanh toán được Momo.',
            'status' => 'pending',
        ]);
    }
}