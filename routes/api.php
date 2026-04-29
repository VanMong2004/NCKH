<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RevenueController;

use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminRevenueController;




/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//     return $request->user();
// });

// Route::middleware(['auth:sanctum', 'admin'])
//     ->patch('/admin/orders/{id}/status', [OrderController::class, 'updateStatus']);
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::patch('/admin/orders/{id}/status', [AdminOrderController::class, 'updateStatus']);
    
    Route::get('/admin/orders', [AdminOrderController::class, 'adminOrders']);
    Route::get('/admin/orders/{id}', [AdminOrderController::class, 'adminShow']);
    
    Route::get('/admin/revenue/overview', [AdminRevenueController::class, 'overview']);
    Route::get('/admin/revenue/daily', [AdminRevenueController::class, 'daily']);
    Route::get('/admin/revenue/products', [AdminRevenueController::class, 'byProduct']);
    Route::get('/admin/revenue/chart', [AdminRevenueController::class, 'chart']);
    Route::get('/admin/revenue/top-products', [AdminRevenueController::class, 'topProducts']);

});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/add', [CartController::class, 'add']);
        Route::post('/update', [CartController::class, 'update']);
        Route::delete('/remove', [CartController::class, 'remove']);
    });
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::post('/orders/{id}/finalize', [OrderController::class, 'finalize']);

    Route::post('/orders/{id}/pay', [PaymentController::class, 'pay']);
    Route::get('/payment/callback', [PaymentController::class, 'callback']);
    // Route::post('/payment/callback', [PaymentController::class, 'callback']);
    
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/confirm', [OrderController::class, 'confirm']);

    Route::get('/orders', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    Route::get('/analytics', [RevenueController::class, 'userAnalytics']);



});

