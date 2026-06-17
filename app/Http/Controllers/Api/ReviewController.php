<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class ReviewController extends Controller
{
    protected $reviewService;

    public function __construct(
        ReviewService $reviewService
    ) {
        $this->reviewService = $reviewService;
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'order_id' => 'required|integer|exists:orders,id',
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'required|string|min:10|max:1000',
                'images' => 'nullable|array|max:5',
                'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
            ], [
                'product_id.required' => 'Vui lòng chọn sản phẩm cần đánh giá',
                'product_id.integer' => 'Sản phẩm không hợp lệ',
                'product_id.exists' => 'Sản phẩm không tồn tại',

                'order_id.required' => 'Vui lòng chọn đơn hàng cần đánh giá',
                'order_id.integer' => 'Đơn hàng không hợp lệ',
                'order_id.exists' => 'Đơn hàng không tồn tại',

                'rating.required' => 'Vui lòng chọn số sao đánh giá',
                'rating.integer' => 'Số sao đánh giá không hợp lệ',
                'rating.min' => 'Số sao đánh giá phải từ 1 đến 5',
                'rating.max' => 'Số sao đánh giá phải từ 1 đến 5',

                'comment.required' => 'Vui lòng nhập nội dung đánh giá',
                'comment.string' => 'Nội dung đánh giá không hợp lệ',
                'comment.min' => 'Nội dung đánh giá phải có ít nhất 10 ký tự',
                'comment.max' => 'Nội dung đánh giá không được vượt quá 1000 ký tự',

                'images.array' => 'Danh sách hình ảnh không hợp lệ',
                'images.max' => 'Chỉ được tải lên tối đa 5 hình ảnh',

                'images.*.image' => 'Tệp tải lên phải là hình ảnh',
                'images.*.mimes' => 'Hình ảnh phải có định dạng jpg, jpeg, png hoặc webp',
                'images.*.max' => 'Mỗi hình ảnh không được vượt quá 5MB',
            ]);

            $review = $this->reviewService->create(
                $request->user(),
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Review thành công',
                'data' => $review,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đánh giá không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404, 409])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Create review database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Create review system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, $id)
    {
        try {
            $request->merge([
                'review_id' => $id,
            ]);

            $data = $request->validate([
                'review_id' => 'required|integer|min:1',

                'rating' => 'required|integer|min:1|max:5',

                'comment' => 'required|string|min:10|max:1000',

                'images' => 'nullable|array|max:5',

                'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:5120',
            ], [
                'review_id.required' => 'Review không hợp lệ',
                'review_id.integer' => 'Review không hợp lệ',
                'review_id.min' => 'Review không hợp lệ',

                'rating.required' => 'Vui lòng chọn số sao đánh giá',
                'rating.integer' => 'Số sao đánh giá không hợp lệ',
                'rating.min' => 'Số sao đánh giá phải từ 1 đến 5',
                'rating.max' => 'Số sao đánh giá phải từ 1 đến 5',

                'comment.required' => 'Vui lòng nhập nội dung đánh giá',
                'comment.string' => 'Nội dung đánh giá không hợp lệ',
                'comment.min' => 'Nội dung đánh giá phải có ít nhất 10 ký tự',
                'comment.max' => 'Nội dung đánh giá không được vượt quá 1000 ký tự',

                'images.array' => 'Danh sách hình ảnh không hợp lệ',
                'images.max' => 'Chỉ được tải lên tối đa 5 hình ảnh',

                'images.*.image' => 'Tệp tải lên phải là hình ảnh',
                'images.*.mimes' => 'Hình ảnh phải có định dạng jpg, jpeg, png hoặc webp',
                'images.*.max' => 'Mỗi hình ảnh không được vượt quá 5MB',
            ]);

            $review = $this->reviewService->update(
                $request->user(),
                $data['review_id'],
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật review thành công',
                'data' => $review,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu cập nhật review không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Update review database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Update review system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, $id)
    {
        try {
            $request->merge([
                'review_id' => $id,
            ]);

            $data = $request->validate([
                'review_id' => 'required|integer|min:1',
            ], [
                'review_id.required' => 'Review không hợp lệ',
                'review_id.integer' => 'Review không hợp lệ',
                'review_id.min' => 'Review không hợp lệ',
            ]);

            $this->reviewService->delete(
                $request->user(),
                $data['review_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Xóa review thành công',
                'data' => null,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu review không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 401, 403, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (QueryException $e) {
            Log::error('Delete review database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Delete review system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REVIEWS
    |--------------------------------------------------------------------------
    */

    public function productReviews(Request $request, $id)
    {
        try {
            $request->merge([
                'product_id' => $id,
            ]);

            $data = $request->validate([
                'product_id' => 'required|integer|min:1',

                'rating' => 'nullable|integer|min:1|max:5',

                'sort' => 'nullable|in:latest,highest,lowest',

                'page' => 'nullable|integer|min:1',

                'per_page' => 'nullable|integer|min:1',
            ], [
                'product_id.required' => 'Sản phẩm không hợp lệ',
                'product_id.integer' => 'Sản phẩm không hợp lệ',
                'product_id.min' => 'Sản phẩm không hợp lệ',

                'rating.integer' => 'Số sao đánh giá không hợp lệ',
                'rating.min' => 'Số sao đánh giá phải từ 1 đến 5',
                'rating.max' => 'Số sao đánh giá phải từ 1 đến 5',

                'sort.in' => 'Kiểu sắp xếp không hợp lệ',

                'page.integer' => 'Số trang không hợp lệ',
                'page.min' => 'Số trang phải lớn hơn hoặc bằng 1',

                'per_page.integer' => 'Số review mỗi trang không hợp lệ',
                'per_page.min' => 'Số review mỗi trang phải lớn hơn hoặc bằng 1',
            ]);

            $reviews = $this->reviewService->listByProduct(
                $data['product_id'],
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Danh sách reviews',
                ...$reviews,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu lấy review không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Get product reviews database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (RuntimeException $e) {
            $statusCode = in_array($e->getCode(), [400, 404])
                ? $e->getCode()
                : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], $statusCode);

        } catch (Throwable $e) {
            Log::error('Get product reviews system error', [
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