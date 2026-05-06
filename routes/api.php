<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// =============================
// CONTROLLERS
// =============================
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\RevenueController;
use App\Http\Controllers\Api\CategoryController;

use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminRevenueController;


// =============================
// PUBLIC ROUTES
// =============================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// =============================
// PRODUCTS (PUBLIC)
// =============================
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{id}', [ProductController::class, 'show']);
    Route::get('/{id}/variants', [ProductController::class, 'variants']);
    Route::get('/{id}/reviews', [ProductController::class, 'reviews']);
});

// =============================
// CATEGORIES (PUBLIC)
// =============================
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
});

// =============================
// CAMPAIGNS (PUBLIC VIEW)
// =============================
Route::prefix('campaigns')->group(function () {
    Route::get('/', [CampaignController::class, 'index']);
    Route::get('/{id}', [CampaignController::class, 'show']);
    Route::get('/{id}/items', [CampaignController::class, 'items']);
});

// =============================
// AUTHENTICATED USER
// =============================
Route::middleware('auth:sanctum')->group(function () {

    // Route::get('/test-queue', function () {
    //     dispatch(function () {
    //         Log::info('DELAY WORKS - ' . now());
    //     })->delay(now()->addSeconds(10));

    //     return response()->json([
    //         'message' => 'Job đã được dispatch, chờ 10s...'
    //     ]);
    // });

    // 🔐 AUTH
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'update']);
    Route::post('/refresh-token', [AuthController::class, 'refresh']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // =============================
    // CART
    // =============================
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/add', [CartController::class, 'add']);
        Route::put('/update', [CartController::class, 'update']); 
        Route::delete('/remove', [CartController::class, 'remove']);
        Route::get('/count', [CartController::class, 'count']);
    });

    // =============================
    // ORDERS (NORMAL)
    // =============================
    Route::post('/checkout', [OrderController::class, 'checkout']);

    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'myOrders']);
        Route::get('/{id}', [OrderController::class, 'show']);

        Route::post('/{id}/cancel', [OrderController::class, 'cancel']);
        Route::post('/{id}/confirm', [OrderController::class, 'confirm']);

        // 🔥 PAYMENT (moved here)
        Route::post('/{id}/pay', [PaymentController::class, 'pay']);
        Route::get('/{id}/payments', [PaymentController::class, 'list']);
    });

    // =============================
    // CAMPAIGN CHECKOUT
    // =============================
    Route::post('/campaign/checkout', [CampaignController::class, 'checkout']);

    // =============================
    // PAYMENT CALLBACK
    // =============================
    Route::get('/payment/callback', [PaymentController::class, 'callback']);

    // =============================
    // REVIEW
    // =============================
    Route::post('/reviews', [ReviewController::class, 'store']);

    // =============================
    // USER ANALYTICS
    // =============================
    Route::get('/analytics', [RevenueController::class, 'userAnalytics']);
});


// =============================
// ADMIN
// =============================
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // =============================
    // ADMIN ORDERS
    // =============================
    Route::prefix('admin/orders')->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/{id}/status', [AdminOrderController::class, 'updateStatus']);
    });

    // =============================
    // ADMIN REVENUE
    // =============================
    Route::prefix('admin/revenue')->group(function () {
        Route::get('/overview', [AdminRevenueController::class, 'overview']);
        Route::get('/daily', [AdminRevenueController::class, 'daily']);
        Route::get('/products', [AdminRevenueController::class, 'byProduct']);
        Route::get('/chart', [AdminRevenueController::class, 'chart']);
        Route::get('/top-products', [AdminRevenueController::class, 'topProducts']);
    });
});

