<?php

namespace App\Services;

use App\Models\Category;

class CategoryService
{
    public function getTree()
    {
        $categories = Category::whereNull('parent_id')
            ->with('children.children') // 2 level
            ->get();

        return [
            'success' => true,
            'data' => $categories
        ];
    }
}