<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\CartService;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class CartController extends Controller
{
    protected $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    // GET CART
    public function index(Request $request)
    {
        try {
            $result = $this->cartService->getCart(
                $request->user()
            );

            return response()->json($result);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Get cart database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get cart system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    // ADD TO CART
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'product_variant_id' => 'required|integer|exists:product_variants,id',
                'quantity' => 'required|integer|min:1',
            ], [
                'product_variant_id.required' => 'Vui lòng chọn biến thể sản phẩm',
                'product_variant_id.integer' => 'Biến thể sản phẩm không hợp lệ',
                'product_variant_id.exists' => 'Biến thể sản phẩm không tồn tại',

                'quantity.required' => 'Vui lòng nhập số lượng',
                'quantity.integer' => 'Số lượng không hợp lệ',
                'quantity.min' => 'Số lượng phải lớn hơn hoặc bằng 1',
            ]);

            $result = $this->cartService->addToCart(
                $request->user(),
                $data
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu thêm vào giỏ hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Add to cart database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);

        } catch (Throwable $e) {
            Log::error('Add to cart system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    // UPDATE CART ITEM
    public function update(Request $request, $id)
    {
        try {
            $request->merge([
                'cart_item_id' => $id,
            ]);

            $data = $request->validate([
                'cart_item_id' => 'required|integer|min:1',
                'quantity' => 'required|integer|min:1',
            ], [
                'cart_item_id.required' => 'Sản phẩm trong giỏ hàng không hợp lệ',
                'cart_item_id.integer' => 'Sản phẩm trong giỏ hàng không hợp lệ',
                'cart_item_id.min' => 'Sản phẩm trong giỏ hàng không hợp lệ',

                'quantity.required' => 'Vui lòng nhập số lượng',
                'quantity.integer' => 'Số lượng không hợp lệ',
                'quantity.min' => 'Số lượng phải lớn hơn hoặc bằng 1',
            ]);

            $result = $this->cartService->updateItem(
                $request->user(),
                $data['cart_item_id'],
                $data['quantity']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu cập nhật giỏ hàng không hợp lệ',
                'errors' => $e->errors(),
            ], 422);

        } catch (QueryException $e) {
            Log::error('Update cart item database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Update cart item system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    // REMOVE CART ITEM
    public function destroy(Request $request, $id)
    {
        try {
            $request->merge([
                'cart_item_id' => $id,
            ]);

            $data = $request->validate([
                'cart_item_id' => 'required|integer|min:1',
            ], [
                'cart_item_id.required' => 'Sản phẩm trong giỏ hàng không hợp lệ',
                'cart_item_id.integer' => 'Sản phẩm trong giỏ hàng không hợp lệ',
                'cart_item_id.min' => 'Sản phẩm trong giỏ hàng không hợp lệ',
            ]);

            $result = $this->cartService->removeItem(
                $request->user(),
                $data['cart_item_id']
            );

            return response()->json($result);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu xoá sản phẩm không hợp lệ',
                'errors' => $e->errors(),
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Remove cart item database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);

        } catch (Throwable $e) {
            Log::error('Remove cart item system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    // COUNT ITEMS IN CART
    public function count(Request $request)
    {
        try {
            $result = $this->cartService->getCount(
                $request->user()
            );

            return response()->json($result);

        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 401);

        } catch (QueryException $e) {
            Log::error('Get cart count database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Get cart count system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}