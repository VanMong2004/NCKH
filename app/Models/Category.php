<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Product;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'image',
        'thumbnail',
        'parent_id',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    // products
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    // parent category
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // child categories
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
