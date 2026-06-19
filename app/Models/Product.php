<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory , SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'category_id',
        'department_id',
        'description',
        'author',
        'is_active',
        'is_featured',
        'average_rating',
        'total_reviews',
        'sold_count',
        'view_count',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function promotionItems()
    {
        return $this->hasMany(PromotionItem::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
}
