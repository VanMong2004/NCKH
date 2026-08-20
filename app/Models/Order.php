<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'order_code',
        'status',
        'expired_at',
        'cancel_reason',
        'total',
        'guest_token',
        'guest_lookup_token',
        'guest_name',
        'guest_email',
        'guest_phone',
        'fulfillment_method',
        'shipping_fee',
        'shipping_name',
        'shipping_phone',
        'shipping_address',
        'sub_total',
        'discount_total',
        'grand_total',
        'payment_status',
    ];

    protected $casts = [
        'total' => 'float',
        'shipping_fee' => 'float',
        'created_at' => 'datetime',
        'expired_at' => 'datetime',
        'cancel_reason' => 'string',
        'guest_lookup_token' => 'string',
        'sub_total' => 'float',
        'discount_total' => 'float',
        'grand_total' => 'float',
        'fulfillment_method' => 'string',
        'payment_status' => 'string',
    ];

    // ========================
    // RELATIONSHIPS
    // ========================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function vatInvoiceRequest()
    {
        return $this->hasOne(VatInvoiceRequest::class);
    }

    public function resolvedShippingAddress(): ?string
    {
        if (!empty($this->shipping_address)) {
            return $this->shipping_address;
        }

        $address = $this->resolvedUserAddress();

        if (!$address) {
            return null;
        }

        return collect([
            $address->address_line,
            $address->ward,
            $address->district,
            $address->province,
        ])->filter()->implode(', ');
    }

    protected function resolvedUserAddress()
    {
        $addresses = $this->user?->addresses;

        if (!$addresses instanceof Collection || $addresses->isEmpty()) {
            return null;
        }

        return $addresses->firstWhere('is_default', true) ?: $addresses->first();
    }
}
