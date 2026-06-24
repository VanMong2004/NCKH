<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Category;
use RuntimeException;

class CategoryService
{
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $categories = Category::query()
            ->withCount('products')
            ->latest()
            ->get();

        return [
            'success' => true,

            'message' => 'Lấy danh sách category thành công',

            'data' => $categories->map(function ($category) {
                return [
                    'id' => $category->id,

                    'name' => $category->name,

                    'parent_id' => $category->parent_id,

                    'products_count' => $category->products_count,
                ];
            }),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TREE
    |--------------------------------------------------------------------------
    */

    public function tree()
    {
        $categories = Category::query()
            ->with('children')
            ->whereNull('parent_id')
            ->get();

        return [
            'success' => true,

            'message' => 'Lấy category tree thành công',

            'data' => $this->buildTree($categories),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $category = Category::with([
            'children',
            'parent',
        ])->find($id);

        if (!$category) {
            throw new RuntimeException('Category không tồn tại', 404);
        }

        return [
            'success' => true,

            'message' => 'Lấy category thành công',

            'data' => [
                'id' => $category->id,

                'name' => $category->name,

                'parent' => $category->parent
                    ? [
                        'id' => $category->parent->id,
                        'name' => $category->parent->name,
                    ]
                    : null,

                'children' => $category->children,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY PRODUCTS
    |--------------------------------------------------------------------------
    */
    public function products($id, array $filters)
    {
        $category = Category::find($id);

        if (!$category) {
            throw new RuntimeException('Category không tồn tại', 404);
        }

        $categoryIds = $this->getAllChildIds($id);

        $products = Product::query()
            ->with([
                'images',
                'variants',
                'category',
            ])
            ->whereIn(
                'category_id',
                $categoryIds
            )
            ->where('is_active', true)
            ->paginate(
                $filters['per_page'] ?? 10
            );

        $data = collect($products->items())
            ->map(function ($product) {
                return [
                    'id' => $product->id,

                    'name' => $product->name,

                    'thumbnail' => $product->thumbnail,

                    'average_rating' => $product->average_rating,

                    'total_reviews' => $product->total_reviews,
                ];
            });

        return [
            'success' => true,

            'message' => 'Lấy sản phẩm category thành công',

            'category' => [
                'id' => $category->id,

                'name' => $category->name,
            ],

            'data' => $data,

            'meta' => [
                'current_page' => $products->currentPage(),

                'last_page' => $products->lastPage(),

                'per_page' => $products->perPage(),

                'total' => $products->total(),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD TREE
    |--------------------------------------------------------------------------
    */

    protected function buildTree($categories)
    {
        return $categories->map(function ($category) {

            return [

                'id'
                    => $category->id,

                'name'
                    => $category->name,

                'children'
                    => $this->buildTree(
                        $category->children
                    ),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET CHILD IDS
    |--------------------------------------------------------------------------
    */

    protected function getAllChildIds($id)
    {
        $ids = [$id];

        $children = Category::where(
            'parent_id',
            $id
        )->pluck('id');

        foreach ($children as $childId) {

            $ids = array_merge(
                $ids,
                $this->getAllChildIds($childId)
            );
        }

        return $ids;
    }
}