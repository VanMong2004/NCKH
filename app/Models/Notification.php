<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'icon',
        'color',
        'action_url',
        'meta',
        'is_read',
        'read_at',
    ];

    protected $casts = [

        'meta' => 'array',

        'is_read' => 'boolean',

        'read_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(
            User::class
        );
    }
}
/*
| Trạng thái | icon             | color     |
| ---------- | ---------------- | --------- |
| Đặt hàng   | `shopping-bag`   | `blue`    |
| Thanh toán | `credit-card`    | `green`   |
| Đang xử lý | `package`        | `amber`   |
| Đang giao  | `truck`          | `indigo`  |
| Hoàn thành | `circle-check`   | `emerald` |
| Đã hủy     | `circle-x`       | `red`     |
| Voucher    | `ticket-percent` | `orange`  |
| Khuyến mãi | `badge-percent`  | `pink`    |
| Hệ thống   | `bell`           | `slate`   |
| AI Chat    | `bot`            | `violet`  |
*/
