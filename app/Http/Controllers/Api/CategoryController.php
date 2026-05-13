<?php

namespace App\Http\Controllers\Api;

use Exception;
use Illuminate\Http\Request;
use App\Services\CategoryService;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(
        CategoryService $categoryService
    ) {
        $this->categoryService = $categoryService;
    }

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        try {

            $result = $this->categoryService
                ->index();

            return response()->json($result);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy danh sách categories',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TREE
    |--------------------------------------------------------------------------
    */

    public function tree()
    {
        try {

            $result = $this->categoryService
                ->tree();

            return response()->json($result);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy category tree',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        try {

            $result = $this->categoryService
                ->show($id);

            return response()->json($result);

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Category không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy category',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCTS
    |--------------------------------------------------------------------------
    */

    public function products(Request $request, $id)
    {
        try {

            $result = $this->categoryService
                ->products($request, $id);

            return response()->json($result);

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Category không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,

                'message'
                    => 'Lỗi khi lấy sản phẩm category',

                'error'
                    => app()->environment('local')
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }
}