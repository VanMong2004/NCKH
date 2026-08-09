<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\File;

// CONTROLLERS
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\UserAnalyticsController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\PolicyController;
use App\Http\Controllers\Api\Admin\AdminBlogController;
use App\Http\Controllers\Api\Admin\AdminPolicyController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\SystemController;
use App\Http\Controllers\Api\GuestOrderController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\AnalyticsEventController;

use App\Http\Controllers\Api\Admin\AdminProductController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\AdminAnalyticsController;
use App\Http\Controllers\Api\Admin\AdminPromotionController;
use App\Http\Controllers\Api\Admin\AdminUserController;
use App\Http\Controllers\Api\Admin\AdminReviewController;
use App\Http\Controllers\Api\Admin\AdminChatConversationController;
use App\Http\Controllers\Api\Admin\AdminSiteContentController;
use App\Http\Controllers\Api\Admin\AdminUploadController;
use App\Http\Controllers\Api\Admin\ChatKnowledgeController;
use App\Http\Controllers\Api\Admin\AdminContactController;
use App\Http\Controllers\Api\Admin\AdminCategoryController;
use App\Http\Controllers\Api\Admin\AdminDepartmentController;

use App\Http\Controllers\Api\N8n\N8nChatKnowledgeController;
use App\Http\Controllers\Api\N8n\N8nSocialCallbackController;






// PUBLIC ROUTES
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/google', [AuthController::class, 'google']);
    Route::post('/login', [AuthController::class, 'login']); // Đăng nhập
    Route::post('/register', [AuthController::class, 'register']); // Đăng ký
    Route::post('/forgot-password', [PasswordResetController::class, 'forgot']); // Quên mật khẩu (gửi email chứa link reset password)
    Route::post('/reset-password', [PasswordResetController::class, 'reset']); // Đặt lại mật khẩu (xử lý link reset password, cập nhật mật khẩu mới) 
});

// HOME (PUBLIC)
Route::prefix('home')->group(function () {
    Route::get('/', [HomeController::class,'getHomeData']); // Lấy dữ liệu cho trang chủ Home Page 
});

Route::get('/site-content', [HomeController::class, 'siteContent']);

Route::middleware('throttle:120,1')
    ->post('/analytics/events', [AnalyticsEventController::class, 'store']);

// PRODUCTS (PUBLIC)
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);// Lấy danh sách sản phẩm, có hỗ trợ filter, search, pagination
    Route::get('/{id}/variants', [ProductController::class, 'variants']);// Lấy danh sách biến thể của sản phẩm
    Route::get('/{id}/reviews', [ReviewController::class, 'productReviews']);// Lấy danh sách đánh giá của sản phẩm
    Route::get('/{slug}', [ProductController::class, 'show']);// Lấy chi tiết sản phẩm
});

// PROMOTIONS (PUBLIC)
Route::prefix('promotions')->group(function () {
    Route::get('/', [PromotionController::class, 'index']);
    Route::get('/{slug}/products', [PromotionController::class, 'products']);
    Route::get('/{slug}', [PromotionController::class, 'show']);
});

// CATEGORIES (PUBLIC)
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class,'index']); // Lấy danh sách category theo dạng phẳng (không có tree)
    Route::get('/tree', [CategoryController::class,'tree']); // Lấy danh sách category theo dạng cây (có tree)
    Route::get('/{id}', [CategoryController::class,'show']); // Lấy chi tiết category, bao gồm cả thông tin parent và children
    Route::get('/{id}/products', [CategoryController::class,'products']); // Lấy danh sách sản phẩm thuộc category (có phân trang)
});

// CART - GUEST + USER
Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']); // Lấy danh sách sản phẩm trong giỏ hàng
    Route::post('/', [CartController::class, 'store']); // Thêm sản phẩm vào giỏ hàng
    Route::put('/{id}', [CartController::class, 'update']); // Cập nhật số lượng sản phẩm trong giỏ hàng
    Route::delete('/{id}', [CartController::class, 'destroy']); // Xóa sản phẩm khỏi giỏ hàng
    Route::get('/count', [CartController::class, 'count']); // Lấy số lượng sản phẩm trong giỏ hàng
});

// CHECKOUT - GUEST + USER
Route::prefix('orders')->group(function () {
    Route::post('/checkout', [OrderController::class, 'checkout'])->middleware('throttle:checkout');

    // Guest/user đều có thể thanh toán nếu có order_id + quyền hợp lệ
    Route::post('/{id}/pay', [PaymentController::class, 'pay'])->middleware('throttle:payment');
});

// GUEST ORDER LOOKUP (DÙNG CHO VIỆC KHÁCH HÀNG KIỂM TRA TÌNH TRẠNG ĐƠN HÀNG MÀ KHÔNG CẦN ĐĂNG NHẬP, CHỈ CẦN CÓ ORDER CODE VÀ SĐT LIÊN KẾT VỚI ĐƠN HÀNG) - PUBLIC
Route::prefix('guest/orders')->group(function () {
    Route::post('/lookup', [GuestOrderController::class,'lookup']);
    Route::post('/{orderCode}/cancel', [GuestOrderController::class, 'cancel']);
    Route::get('/{orderCode}/vat-invoice-request', [GuestOrderController::class, 'vatInvoiceRequest']);
    Route::post('/{orderCode}/vat-invoice-request', [GuestOrderController::class, 'storeVatInvoiceRequest']);
});

// PAYMENT CALLBACK PUBLIC (DÙNG CHO VIỆC NHẬN CALLBACK TỪ CỔNG THANH TOÁN, KHÔNG CẦN XÁC THỰC TOKEN VÌ CỔNG THANH TOÁN SẼ GỬI CALLBACK VÀO ĐÂY) - IGNORE
Route::get('/payment/callback', [PaymentController::class, 'callback'])
    ->name('payment.callback');
Route::post('/payment/callback', [PaymentController::class, 'callback']);

// NOTIFICATIONS (PUBLIC) - DÙNG CHO VIỆC TEST GỬI NOTIFICATION QUA API, KHÔNG DÙNG CHO NGƯỜI DÙNG CUỐI
Route::middleware('throttle:webhook')
->post('/webhooks/notifications/create',[NotificationController::class,'create']); // API này chỉ dành cho admin hoặc hệ thống tạo notification, không phải người dùng cuối

// BLOG (PUBLIC)
Route::prefix('blogs')->group(function () {
    Route::get('/', [BlogController::class, 'index']);
    Route::get('/{identifier}', [BlogController::class, 'show']);
});

// SEARCH SUGGESTIONS
Route::prefix('search')->group(function () {
    Route::get('/suggestions', [SearchController::class, 'suggestions']);
});

// POLICIES (PUBLIC)
Route::prefix('policies')->group(function () {
    Route::get('/', [PolicyController::class, 'index']); // Lấy danh sách chính sách, có hỗ trợ filter theo type (ví dụ: terms, privacy, refund, v.v.) và keyword (tìm kiếm trong title và content), có hỗ trợ pagination
    Route::get('/{slug}', [PolicyController::class, 'show']); // Lấy chi tiết chính sách, tìm kiếm bằng slug, trả về thông tin chi tiết của chính sách
});

// CONTACT (PUBLIC)
Route::get('/contact-info', [ContactController::class, 'info']); // Lấy thông tin liên hệ (địa chỉ, email, số điện thoại, v.v.)
Route::post('/contact', [ContactController::class, 'submit'])->middleware('throttle:contact'); // Gửi thông tin liên hệ (tên, email, subject, message), có thể dùng cho form contact trên website hoặc app, thông tin gửi lên sẽ được lưu vào database và gửi email thông báo cho admin

// SYSTEM STATE (PUBLIC) - DÙNG CHO VIỆC CHECK TÌNH TRẠNG
Route::get('/system/state',[SystemController::class,'state']);

// AI CHATBOT
Route::prefix('chat')->group(function () {
    Route::get('/session/current', [ChatController::class, 'current']);
    Route::get('/session/current/messages', [ChatController::class, 'currentMessages']);
    Route::post('/reset', [ChatController::class, 'reset'])->middleware('throttle:chatbot');
    Route::post('/translate', [ChatController::class, 'translate'])->middleware('throttle:chatbot');
    Route::post('/send', [ChatController::class, 'send'])->middleware('throttle:chatbot');
    Route::get('/conversations', [ChatController::class, 'conversations']);
    Route::get('/conversations/{id}', [ChatController::class, 'show']);
});

// AUTHENTICATED USER
Route::middleware('auth:sanctum')->group(function () {

    // USER PROFILE
    Route::get('/me', [AuthController::class, 'me']); // Lấy thông tin người dùng hiện tại
    Route::put('/me', [AuthController::class, 'update']);
    Route::post('/me', [AuthController::class, 'update']); // Cập nhật thông tin người dùng hiện tại (name, email, password)
    Route::post('/refresh-token', [AuthController::class, 'refresh']); // Làm mới token (nếu có refresh token, hoặc chỉ đơn giản là tạo token mới)
    Route::post('/logout', [AuthController::class, 'logout']); // Đăng xuất

    // ORDERS (NORMAL)
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'myOrders']); // Lấy danh sách đơn hàng của người dùng
        Route::get('/{id}', [OrderController::class, 'show']); // Lấy chi tiết đơn hàng
        Route::get('/{id}/vat-invoice-request', [OrderController::class, 'vatInvoiceRequest']);
        Route::post('/{id}/vat-invoice-request', [OrderController::class, 'storeVatInvoiceRequest']);
        Route::post('/{id}/cancel', [OrderController::class, 'cancel']); // Hủy đơn hàng (nếu chưa thanh toán)
        Route::get('/{id}/payments', [PaymentController::class, 'list']); // Lấy danh sách payment của đơn hàng (có hỗ trợ filter theo status)
    });

    // PAYMENTS (NORMAL) - DÙNG CHO VIỆC TẠO PAYMENT CHO ĐƠN HÀNG, KHÔNG DÙNG CHO VIỆC NHẬN CALLBACK TỪ CỔNG THANH TOÁN
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'history']); // Lấy lịch sử payment của người dùng (có hỗ trợ filter theo status, date range, v.v.)
        Route::get('/summary', [PaymentController::class, 'summary']); // Lấy tổng quan về payment của người dùng (tổng số tiền đã thanh toán, số lượng đơn hàng đã thanh toán, v.v.)
        Route::get('/{id}', [PaymentController::class, 'show']); // Lấy chi tiết payment, bao gồm cả thông tin transaction từ cổng thanh toán (có thể dùng cho trang lịch sử đơn hàng hoặc trang chi tiết đơn hàng)
    });

    // REVIEW
    Route::prefix('reviews')->group(function () {
        Route::post('/', [ReviewController::class,'store']); // Tạo đánh giá mới (có thể là đánh giá sản phẩm hoặc chiến dịch, tùy vào payload gửi lên)
        Route::put('/{id}', [ReviewController::class,'update']); // Cập nhật đánh giá theo đúng RESTful method cho frontend/form-data
        Route::post('/{id}', [ReviewController::class,'update']); // Cập nhật đánh giá (chỉ cho phép cập nhật nội dung đánh giá, không cho phép thay đổi sản phẩm/chiến dịch đã đánh giá)
        Route::delete('/{id}', [ReviewController::class,'destroy']); // Xóa đánh giá (chỉ cho phép xóa đánh giá của chính mình)
    });


    // RECENTLY VIEWED PRODUCTS
    Route::get('/recently-viewed', [ProductController::class, 'recentlyViewed']); // Lấy danh sách sản phẩm đã xem gần đây (dựa trên cookie hoặc database, có hỗ trợ pagination)

    // USER ADDRESSES
    Route::prefix('addresses')->group(function () {
        Route::get('/', [AddressController::class, 'index']);// Lấy danh sách địa chỉ của người dùng
        Route::post('/', [AddressController::class, 'store']);// Tạo địa chỉ mới
        Route::put('/{id}', [AddressController::class, 'update']);// Cập nhật địa chỉ (chỉ cho phép cập nhật thông tin địa chỉ, không cho phép thay đổi địa chỉ mặc định)
        Route::delete('/{id}', [AddressController::class, 'destroy']);// Xóa địa chỉ
        Route::post('/{id}/default', [AddressController::class,'setDefault']);// Đặt địa chỉ làm mặc định
    });

    // NOTIFICATIONS
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('/{id}/read', [NotificationController::class, 'markRead']);
        Route::put('/read-all', [NotificationController::class, 'markAllRead']);
        Route::get('/{id}', [NotificationController::class, 'show']);
    });

    // SEARCH
    Route::prefix('search')->group(function(){
        Route::get('/history',[SearchController::class,'history']);
        Route::delete('/history/{id}',[SearchController::class,'deleteHistory']);
        Route::delete('/history',[SearchController::class,'clearHistory']);
    });


    // USER ANALYTICS
    Route::prefix('user/analytics')->group(function () {
        Route::get('/overview', [UserAnalyticsController::class, 'overview']);
        Route::get('/orders', [UserAnalyticsController::class, 'orders']);
        Route::get('/spending', [UserAnalyticsController::class, 'spending']);
        Route::get('/interests', [UserAnalyticsController::class, 'interests']);
        Route::get('/order-tracking', [UserAnalyticsController::class, 'orderTracking']);
        Route::get('/export/pdf', [UserAnalyticsController::class, 'exportPdf']);
        Route::get('/export/excel', [UserAnalyticsController::class, 'exportExcel']);
    });
});


// N8N AI KNOWLEDGE SYNC
Route::prefix('n8n/chat/knowledge')->middleware('throttle:webhook')->group(function () {
    Route::post('/sync-status', [N8nChatKnowledgeController::class, 'syncStatus']);
});

// N8N SOCIAL CALLBACK
Route::post('/n8n/social/callback', [N8nSocialCallbackController::class, 'handle'])->middleware('throttle:webhook');

// ADMIN
Route::middleware(['auth:sanctum', 'admin', 'throttle:admin'])->prefix('admin')->group(function () {

    // ADMIN SITE CONTENT
    Route::prefix('site-components')->group(function () {
        Route::get('/', [AdminSiteContentController::class, 'index']);
        Route::post('/', [AdminSiteContentController::class, 'store']);

        Route::get('/{id}', [AdminSiteContentController::class, 'show']);
        Route::put('/{id}', [AdminSiteContentController::class, 'update']);
        Route::delete('/{id}', [AdminSiteContentController::class, 'destroy']);
        Route::patch('/{id}/toggle', [AdminSiteContentController::class, 'toggle']);

        Route::post('/{id}/items', [AdminSiteContentController::class, 'storeItem']);
        Route::patch('/{id}/items/reorder', [AdminSiteContentController::class, 'reorderItems']);
    });

    Route::prefix('site-component-items')->group(function () {
        Route::put('/{itemId}', [AdminSiteContentController::class, 'updateItem']);
        Route::delete('/{itemId}', [AdminSiteContentController::class, 'destroyItem']);
        Route::patch('/{itemId}/toggle', [AdminSiteContentController::class, 'toggleItem']);
    });

    // ADMIN UPLOADS
    Route::prefix('uploads')->middleware('throttle:upload')->group(function () {
        Route::post('/image', [AdminUploadController::class, 'image']);
    });

    // ADMIN USERS
    Route::prefix('users')->group(function () {
        Route::get('/', [AdminUserController::class, 'index']);
        Route::get('/{id}', [AdminUserController::class, 'show']);
        Route::patch('/{id}/role', [AdminUserController::class, 'updateRole']);
        Route::patch('/{id}/restore', [AdminUserController::class, 'restore']);
        Route::patch('/{id}/lock', [AdminUserController::class, 'lock']);
        Route::patch('/{id}/unlock', [AdminUserController::class, 'unlock']);
        Route::delete('/{id}', [AdminUserController::class, 'destroy']);
    });

    // ADMIN CONTACTS
    Route::prefix('contacts')->group(function () {
        Route::get('/', [AdminContactController::class, 'index']);
        Route::get('/{id}', [AdminContactController::class, 'show']);
        Route::patch('/{id}/status', [AdminContactController::class, 'updateStatus']);
        Route::patch('/{id}/note', [AdminContactController::class, 'updateNote']);
        Route::delete('/{id}', [AdminContactController::class, 'destroy']);
    });

    // ADMIN CATEGORIES
    Route::prefix('categories')->group(function () {
        Route::get('/', [AdminCategoryController::class, 'index']);
        Route::post('/', [AdminCategoryController::class, 'store']);
        Route::get('/active-options', [AdminCategoryController::class, 'activeOptions']);
        Route::get('/{id}', [AdminCategoryController::class, 'show']);
        Route::put('/{id}', [AdminCategoryController::class, 'update']);
        Route::patch('/{id}/toggle-active', [AdminCategoryController::class, 'toggleActive']);
        Route::delete('/{id}', [AdminCategoryController::class, 'destroy']);
    });

    // ADMIN DEPARTMENTS
    Route::prefix('departments')->group(function () {
        Route::get('/', [AdminDepartmentController::class, 'index']);
        Route::post('/', [AdminDepartmentController::class, 'store']);
        Route::get('/active-options', [AdminDepartmentController::class, 'activeOptions']);
        Route::get('/{id}', [AdminDepartmentController::class, 'show']);
        Route::put('/{id}', [AdminDepartmentController::class, 'update']);
        Route::patch('/{id}/toggle-active', [AdminDepartmentController::class, 'toggleActive']);
        Route::delete('/{id}', [AdminDepartmentController::class, 'destroy']);
    });

    // ADMIN ORDERS
    Route::prefix('orders')->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('/{id}', [AdminOrderController::class, 'show']);
        Route::patch('/{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::patch('/{id}/vat-invoice-status', [AdminOrderController::class, 'updateVatInvoiceStatus']);
    });  

    // ADMIN POLICIES
    Route::prefix('policies')->group(function () {
        Route::get('/', [AdminPolicyController::class, 'index']);
        Route::post('/', [AdminPolicyController::class, 'store']);
        Route::get('/{id}', [AdminPolicyController::class, 'show']);
        Route::put('/{id}', [AdminPolicyController::class, 'update']);
        Route::patch('/{id}/toggle-active', [AdminPolicyController::class, 'toggleActive']);
        Route::delete('/{id}', [AdminPolicyController::class, 'destroy']);
    });

    // ADMIN BLOGS
    Route::prefix('blogs')->group(function () {
        Route::get('/', [AdminBlogController::class, 'index']);
        Route::post('/', [AdminBlogController::class, 'store']);
        Route::get('/{id}', [AdminBlogController::class, 'show']);
        Route::post('/{id}', [AdminBlogController::class, 'update']);
        Route::patch('/{id}/status', [AdminBlogController::class, 'updateStatus']);
        Route::delete('/{id}', [AdminBlogController::class, 'destroy']);
    });

    // ADMIN PRODUCTS
    Route::prefix('products')->group(function () {
        Route::get('/', [AdminProductController::class, 'index']);// Lấy danh sách sản phẩm (có hỗ trợ filter, search, pagination)
        Route::post('/', [AdminProductController::class, 'store']);// Tạo sản phẩm mới
        Route::get('/{id}', [AdminProductController::class, 'show']);// Lấy chi tiết sản phẩm
        Route::post('/{id}', [AdminProductController::class, 'update']);// Cập nhật sản phẩm
        Route::delete('/{id}', [AdminProductController::class, 'destroy']);// Xóa sản phẩm
        
        Route::post('/{id}/toggle-sale', [AdminProductController::class, 'toggleProductSale']);
        Route::post('/variants/{id}/toggle-sale', [AdminProductController::class, 'toggleVariantSale']);
        
        Route::post('/{id}/facebook-caption', [AdminProductController::class, 'generateFacebookCaption']);
        Route::post('/{id}/post-facebook', [AdminProductController::class, 'postFacebook']);
    });

    Route::get('/images/products/{folder}/{file}', function (
        $folder,
        $file
    ) {

        $path = public_path(
            'images/products/'
            . $folder
            . '/'
            . $file
        );

        if (!File::exists($path)) {
            abort(404);
        }

        return Response::file($path);

    });

    // ADMIN PROMOTIONS
    Route::prefix('promotions')->group(function () {
        Route::get('/', [AdminPromotionController::class, 'index']);
        Route::post('/', [AdminPromotionController::class, 'store']);
        Route::get('/{id}', [AdminPromotionController::class, 'show']);
        Route::put('/{id}', [AdminPromotionController::class, 'update']);
        Route::delete('/{id}', [AdminPromotionController::class, 'destroy']);

        Route::get('/{id}/items', [AdminPromotionController::class, 'items']);
        Route::get('/{id}/available-products', [AdminPromotionController::class, 'availableProducts']);
        Route::post('/{id}/items/bulk', [AdminPromotionController::class,'storeItemsBulk']); // thêm nhiều item cùng lúc vào promotion
        Route::post('/{id}/items', [AdminPromotionController::class, 'storeItem']); // thêm 1 item vào promotion
        Route::put('/items/{itemId}', [AdminPromotionController::class, 'updateItem']);
        Route::delete('/items/{itemId}', [AdminPromotionController::class, 'destroyItem']);
    
        Route::post('/{id}/facebook-caption', [AdminPromotionController::class, 'generateFacebookCaption']);
        Route::post('/{id}/publish-social', [AdminPromotionController::class, 'publishSocial']);
    });

    // ADMIN ANALYTICS
    Route::prefix('analytics')->middleware('admin')->group(function () {
        Route::get('/overview', [AdminAnalyticsController::class, 'overview']);
        Route::get('/behavior-overview', [AdminAnalyticsController::class, 'behaviorOverview']);
        Route::get('/behavior-chart', [AdminAnalyticsController::class, 'behaviorChart']);
        Route::get('/revenue-by-category', [AdminAnalyticsController::class, 'revenueByCategory']);
        Route::get('/top-products', [AdminAnalyticsController::class, 'topProducts']);
        Route::get('/top-viewed-products', [AdminAnalyticsController::class, 'topViewedProducts']);
        Route::get('/sales-chart', [AdminAnalyticsController::class, 'salesChart']);
        Route::get('/export/pdf', [AdminAnalyticsController::class, 'exportPdf']);
        Route::get('/export/excel', [AdminAnalyticsController::class, 'exportExcel']);
    });

    // ADMIN REVIEWS
    Route::prefix('reviews')->group(function () {
        Route::get('/', [AdminReviewController::class, 'index']);
        Route::get('/statistics', [AdminReviewController::class, 'statistics']);
        Route::get('/{id}', [AdminReviewController::class, 'show']);
        Route::patch('/{id}/hide', [AdminReviewController::class, 'hide']);
        Route::patch('/{id}/show', [AdminReviewController::class, 'showReview']);
        Route::delete('/{id}', [AdminReviewController::class, 'destroy']);
    });

    // ADMIN AI KNOWLEDGE
    Route::prefix('chat/knowledge')->group(function () {
        Route::get('/', [ChatKnowledgeController::class, 'index']);
        Route::post('/upload', [ChatKnowledgeController::class, 'upload'])->middleware('throttle:upload');
        Route::get('/{id}', [ChatKnowledgeController::class, 'show']);
        Route::patch('/{id}/toggle', [ChatKnowledgeController::class, 'toggle']);
        Route::delete('/{id}', [ChatKnowledgeController::class, 'destroy']);
    });

    // ADMIN AI CHAT CONVERSATIONS
    Route::prefix('chat/conversations')->group(function () {
        Route::get('/', [AdminChatConversationController::class, 'index']);
        Route::get('/statistics', [AdminChatConversationController::class, 'statistics']);
        Route::patch('/{id}/close', [AdminChatConversationController::class, 'close']);
        Route::get('/{id}', [AdminChatConversationController::class, 'show']);
    });

    
});

// Route::get('/dev/php-ssl-check', function () {
//     return response()->json([
//         'php_version' => PHP_VERSION,
//         'loaded_ini' => php_ini_loaded_file(),
//         'curl_cainfo' => ini_get('curl.cainfo'),
//         'openssl_cafile' => ini_get('openssl.cafile'),
//         'curl_cainfo_exists' => file_exists(ini_get('curl.cainfo')),
//         'openssl_cafile_exists' => file_exists(ini_get('openssl.cafile')),
//     ]);
// });
