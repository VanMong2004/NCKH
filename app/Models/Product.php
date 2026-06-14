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

    // category
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // images
    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    // variants
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    // reviews
    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
