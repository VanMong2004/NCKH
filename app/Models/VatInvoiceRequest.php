<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VatInvoiceRequest extends Model
{
    protected $fillable = [
        'order_id',
        'user_id',
        'order_code',
        'customer_name',
        'customer_email',
        'customer_phone',
        'company_name',
        'tax_code',
        'company_address',
        'invoice_email',
        'status',
        'note',
        'admin_note',
        'issued_at',
        'processed_by',
        'processed_at',
        'fulfilled_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'processed_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
