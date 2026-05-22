<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class About extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slogan',
        'banner',
        'description',
        'mission',
        'vision',
        'student_count',
        'major_count',
        'teacher_count',
        'years_of_operation',
        'gallery',
        'is_active',
    ];

    protected $casts = [
        'gallery' => 'array',
        'is_active' => 'boolean',
    ];
}