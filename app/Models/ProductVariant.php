<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Product;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'size',
        'color',
        'sku',
        'price',
        'stock',
        'reserved_stock',
        'sold_stock',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
