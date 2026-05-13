<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\Request;

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

            $request->validate([
                'product_id'
                    => 'required|exists:products,id',

                'rating'
                    => 'required|integer|min:1|max:5',

                'comment'
                    => 'required|string|min:10|max:1000',

                'images'
                    => 'nullable|array|max:5',

                'images.*'
                    => 'image|mimes:jpg,jpeg,png,webp|max:5120',
            ]);

            $review = $this->reviewService->create(
                $request->user(),
                $request->all()
            );

            return response()->json([
                'success' => true,
                'message' => 'Review thành công',
                'data' => $review,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
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

            $review = Review::with('images')
                ->findOrFail($id);

            $data = $request->all();

            if ($request->method() === 'POST'
                && $request->query('_method') === 'PUT') {

                $data = array_merge(
                    $data,
                    $request->post()
                );
            }

            validator($data, [
                'rating'
                    => 'required|integer|min:1|max:5',

                'comment'
                    => 'required|string|min:10|max:1000',

                'images'
                    => 'nullable|array|max:5',

                'images.*'
                    => 'image|mimes:jpg,jpeg,png,webp|max:5120',
            ])->validate();

            $review = $this->reviewService->update(
                $request->user(),
                $review,
                $data
            );

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật review thành công',
                'data' => $review,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
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

            $review = Review::with('images')
                ->findOrFail($id);

            $this->reviewService->delete(
                $request->user(),
                $review
            );

            return response()->json([
                'success' => true,
                'message' => 'Xóa review thành công',
                'data' => null,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT REVIEWS
    |--------------------------------------------------------------------------
    */

    public function productReviews(
        Request $request,
        $id
    ) {
        try {

            $product = Product::findOrFail($id);

            $reviews = $this->reviewService
                ->listByProduct(
                    $product,
                    $request->all()
                );

            return response()->json([
                'success' => true,
                'message' => 'Danh sách reviews',
                ...$reviews
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null,
            ], 400);
        }
    }
}