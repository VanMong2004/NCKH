<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Category;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'category_id',
        'description',
        'is_active',
        'is_featured',
        'avg_rating',
        'review_count',
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
