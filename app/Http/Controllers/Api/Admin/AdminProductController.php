<?php

namespace App\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminProductService;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AdminProductController extends Controller
{
    protected $adminProductService;

    public function __construct(
        AdminProductService $adminProductService
    ) {
        $this->adminProductService = $adminProductService;
    }

    public function index(Request $request)
    {
        try {

            return response()->json(
                $this->adminProductService->index($request)
            );

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy danh sách sản phẩm',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    public function show($id)
    {
        try {

            return response()->json(
                $this->adminProductService->show($id)
            );

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy chi tiết sản phẩm',
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {

            validator($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category_id' => 'required|exists:categories,id',
                'is_active' => 'required|boolean',
                'is_featured' => 'required|boolean',
                'department_id' => 'nullable|exists:departments,id',
                'author' => 'nullable|string|max:255',

                'images' => 'required|array|min:1|max:10',
                'images.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
                
                'variants' => 'required|array|min:1',
                'variants.*.id' => 'nullable|integer|exists:product_variants,id',
                'variants.*.sku' => 'nullable|string|max:100',
                'variants.*.attributes' => 'nullable|array',
                'variants.*.size' => 'nullable|string|max:50',
                'variants.*.color' => 'nullable|string|max:50',
                'variants.*.price' => 'required|numeric|min:0',
                'variants.*.stock' => 'required|integer|min:0',
                'variants.*.is_active' => 'nullable|boolean',

            ])->validate();

            // dd($request->all());

            return response()->json(
                $this->adminProductService->store($request)
            );

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function update(Request $request, $id)
    {
        try {

            validator($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'department_id' => 'nullable|exists:departments,id',
                'author' => 'nullable|string|max:255',
                'category_id' => 'required|exists:categories,id',
                'is_active' => 'required|boolean',
                'is_featured' => 'required|boolean',

                'images' => 'nullable|array|min:1|max:10',
                'images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                
                'variants' => 'nullable|array|min:1',
                'variants.*.id' => 'nullable|integer|exists:product_variants,id',
                'variants.*.sku' => 'nullable|string|max:100',
                'variants.*.attributes' => 'nullable|array',
                'variants.*.size' => 'nullable|string|max:50',
                'variants.*.color' => 'nullable|string|max:50',
                'variants.*.price' => 'nullable|numeric|min:0',
                'variants.*.stock' => 'nullable|integer|min:0',
                'variants.*.is_active' => 'nullable|boolean',
                
            ])->validate();

            return response()->json(
                $this->adminProductService->update(
                    $request,
                    $id
                )
            );

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function destroy($id)
    {
        try {

            return response()->json(
                $this->adminProductService->destroy($id)
            );

        } catch (ModelNotFoundException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Sản phẩm không tồn tại',
            ], 404);

        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local')
                    ? $e->getMessage()
                    : null,
            ], 400);
        }
    }

    public function toggleProductSale(Request $request, $id)
    {
        try {
            validator($request->all(), [
                'is_active' => 'required|boolean',
            ])->validate();

            return response()->json(
                $this->adminProductService->toggleProductSale($id, $request->boolean('is_active'))
            );
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    public function toggleVariantSale(Request $request, $id)
    {
        try {
            validator($request->all(), [
                'is_active' => 'required|boolean',
            ])->validate();

            return response()->json(
                $this->adminProductService->toggleVariantSale($id, $request->boolean('is_active'))
            );
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }

    public function postFacebook($id)
    {
        try {
            return response()->json(
                $this->adminProductService->postFacebook($id)
            );
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => app()->environment('local') ? $e->getMessage() : null,
            ], 400);
        }
    }
}