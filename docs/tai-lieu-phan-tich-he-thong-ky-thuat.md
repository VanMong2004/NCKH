# Tài liệu phân tích hệ thống kỹ thuật

Tên đề tài: "Xây dựng cổng dịch vụ số cho phép sinh viên đăng ký các sản phẩm thương hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ"

Chủ nhiệm đề tài: Bùi Hữu Nhật

Thành viên: Bùi Hữu Nhật, Lê Văn Mộng, Võ Kiều My

Khoa: Công nghệ thông tin

Ngành: Kỹ thuật phần mềm

Giảng viên hướng dẫn: Hoàng Thị Phương Thảo, Lưu Nguyễn Anh Thư

Thời gian thực hiện: 01/2026 đến 06/2026

Mục tiêu tổng quát: Xây dựng cổng dịch vụ số tập trung, cho phép sinh viên đăng ký, thanh toán và theo dõi các sản phẩm mang thương hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ trực tuyến, minh bạch và thuận tiện.

Ghi chú phạm vi: Tài liệu này được lập dựa trên mã nguồn Laravel + React hiện tại. Các chức năng chưa thấy rõ trong mã nguồn được ghi là "Chưa xác định trong mã nguồn" hoặc "Cần bổ sung từ người thực hiện".

## 1. Tổng quan hệ thống

### 1.1 Kiến trúc tổng thể

Hệ thống được xây dựng theo mô hình ứng dụng web một trang (SPA) kết hợp API backend:

- Backend Laravel 10 cung cấp REST API, xử lý nghiệp vụ, xác thực, đặt hàng, thanh toán, quản trị, chatbot, thống kê và tích hợp dịch vụ ngoài.
- Frontend React 18 chạy qua Vite, sử dụng React Router để định tuyến giao diện người dùng và quản trị.
- Laravel phục vụ view gốc `resources/views/app.blade.php`; route web `/{any}` trả về SPA React.
- Các API chính nằm trong `routes/api.php`.
- Dữ liệu được lưu qua Eloquent ORM vào hệ quản trị CSDL quan hệ, cấu hình mặc định theo Laravel là MySQL hoặc hệ tương thích. Cần bổ sung từ người thực hiện nếu môi trường triển khai cuối dùng hệ CSDL khác.
- Xác thực người dùng sử dụng Laravel Sanctum với bảng `personal_access_tokens`.
- Hệ thống có queue database cho job nền như hủy đơn hết hạn, đồng bộ/tóm tắt hội thoại, gửi social automation.
- Hệ thống có broadcasting qua Pusher/Echo cho một số cập nhật realtime như analytics và notification.

### 1.2 Công nghệ sử dụng

| Nhóm | Công nghệ | Vai trò |
|---|---|---|
| Backend | Laravel 10 | Xây dựng API, xử lý nghiệp vụ, middleware, queue, event |
| Ngôn ngữ backend | PHP 8.1+ | Ngôn ngữ phát triển backend |
| ORM | Eloquent ORM | Truy vấn và ánh xạ dữ liệu |
| Auth | Laravel Sanctum | Token API cho user/admin |
| Frontend | React 18 | Xây dựng giao diện người dùng và quản trị |
| Build tool | Vite | Build và dev server frontend |
| CSS | Tailwind CSS | Thiết kế giao diện |
| HTTP client | Axios | Gọi API từ frontend |
| Routing frontend | react-router-dom | Định tuyến SPA |
| Chart | ApexCharts, react-apexcharts | Biểu đồ thống kê |
| PDF | barryvdh/laravel-dompdf | Xuất hóa đơn, báo cáo PDF |
| Excel | maatwebsite/excel | Xuất báo cáo Excel |
| Realtime | Pusher, Laravel Echo | Notification/analytics realtime |
| AI | OpenAI API | Chatbot, dịch, sinh caption, vector store |
| Automation | n8n webhook | Social automation và callback |
| Payment | VNPay, mock payment, COD | Thanh toán đơn hàng |

### 1.3 Vai trò từng thành phần

Laravel dùng cho:

- Cung cấp REST API.
- Xử lý xác thực, phân quyền user/admin.
- Xử lý giỏ hàng, sản phẩm, khuyến mãi, đơn hàng, thanh toán.
- Quản lý tồn kho qua `stock`, `reserved_stock`, `sold_stock`.
- Ghi lịch sử trạng thái đơn hàng.
- Quản lý nội dung website, bài viết, FAQ, chính sách, liên hệ.
- Quản lý chatbot AI, tri thức upload, hội thoại.
- Quản lý thống kê, báo cáo, xuất PDF/Excel.
- Tích hợp OpenAI, n8n, VNPay/mock payment.

React dùng cho:

- Trang chủ, shop, chi tiết sản phẩm, giỏ hàng, checkout, kết quả thanh toán.
- Trang tài khoản người dùng: hồ sơ, địa chỉ, đơn hàng, giao dịch, thông báo.
- Khu vực admin: dashboard, sản phẩm, khuyến mãi, đơn hàng, người dùng, đánh giá, nội dung website, chatbot knowledge, hội thoại AI, analytics.
- Floating AI chat.

Database dùng cho:

- Lưu người dùng, địa chỉ, token xác thực.
- Lưu sản phẩm, danh mục, khoa/bộ phận, biến thể, hình ảnh.
- Lưu giỏ hàng, đơn hàng, thanh toán, lịch sử trạng thái.
- Lưu khuyến mãi và sản phẩm áp dụng.
- Lưu đánh giá, notification, lịch sử tìm kiếm, sản phẩm đã xem.
- Lưu nội dung website, blog, FAQ, policy, contact, about.
- Lưu dữ liệu analytics, chat, vector knowledge metadata, social automation log.

### 1.4 Dịch vụ bên ngoài

| Dịch vụ | Tình trạng trong code | Vai trò |
|---|---|---|
| OpenAI API | Có | Chatbot, dịch sang tiếng Việt, tóm tắt hội thoại, sinh caption social |
| OpenAI Vector Store | Có | Lưu và tra cứu tài liệu tri thức tĩnh qua file search |
| n8n | Có | Nhận webhook social automation, callback trạng thái, sync trạng thái AI knowledge |
| VNPay | Có | Tạo URL thanh toán và xử lý callback |
| Mock payment | Có | Thanh toán giả lập/QR giả lập phục vụ demo hoặc sandbox |
| COD | Có | Thanh toán khi nhận hàng, giới hạn theo code là 500.000đ |
| Pusher/Echo | Có | Realtime notification/analytics |
| Social automation | Có | Tạo caption và gửi webhook đăng sản phẩm/khuyến mãi qua n8n |

## 2. Tác nhân hệ thống

| Tác nhân | Mô tả | Quyền/chức năng chính |
|---|---|---|
| Khách truy cập | Người chưa đăng nhập, được định danh tạm bằng `guest_token` ở một số luồng | Xem sản phẩm, tìm kiếm, xem khuyến mãi, thêm giỏ hàng, checkout guest, thanh toán, tra cứu đơn guest, dùng chatbot guest |
| Sinh viên/người dùng đã đăng nhập | Người dùng có tài khoản `role = user` | Quản lý hồ sơ, địa chỉ, giỏ hàng, đặt hàng, thanh toán, theo dõi/hủy đơn, đánh giá sản phẩm, xem thông báo, xem analytics cá nhân, dùng chatbot |
| Quản trị viên | Người dùng có `role = admin` | Quản lý sản phẩm, đơn hàng, người dùng, khuyến mãi, đánh giá, nội dung website, upload tri thức AI, xem hội thoại chatbot, xem dashboard và báo cáo |
| Hệ thống thanh toán | VNPay, mock payment, COD | Tạo giao dịch, chuyển hướng hoặc callback kết quả thanh toán |
| Hệ thống AI/chatbot | OpenAI Responses API và vector store | Trả lời câu hỏi sản phẩm, khuyến mãi, đơn hàng, chính sách/tài liệu tĩnh |
| Hệ thống n8n | Workflow automation ngoài Laravel | Nhận webhook social, callback kết quả social, đồng bộ trạng thái knowledge file |
| Hệ thống realtime | Pusher/Echo | Phát sự kiện notification/order/analytics |

Ghi chú: Code có trường `mssv` trong bảng `users`, nhưng việc bắt buộc xác thực sinh viên theo MSSV khi đăng ký tài khoản chưa xác định rõ trong mã nguồn hiện tại.

## 3. Phân hệ chức năng

### 3.1 Quản lý tài khoản và xác thực

Chức năng có trong code:

- Đăng ký tài khoản qua `/api/auth/register`.
- Đăng nhập qua `/api/auth/login`.
- Đăng xuất qua `/api/logout`.
- Lấy và cập nhật thông tin cá nhân qua `/api/me`.
- Refresh token qua `/api/refresh-token`.
- Quên mật khẩu và đặt lại mật khẩu qua email.
- Upload/cập nhật avatar người dùng.
- Khóa/mở khóa tài khoản ở admin.
- Phân quyền admin qua `AdminMiddleware` và `AdminRoute`.
- Khi đăng nhập, hệ thống có merge giỏ hàng guest vào giỏ hàng user nếu có `guest_token`.

Chưa xác định trong mã nguồn:

- Quy trình xác thực email bắt buộc trước khi mua hàng.
- Quy trình xác minh sinh viên bằng MSSV hoặc hệ thống sinh viên của Trường.

### 3.2 Quản lý sản phẩm thương hiệu

Chức năng có trong code:

- Danh sách sản phẩm công khai có phân trang, tìm kiếm, lọc theo danh mục, khoa/bộ phận, giá, size, màu, rating, tồn kho.
- Chi tiết sản phẩm gồm mô tả, ảnh, biến thể, tồn kho, đánh giá, sản phẩm liên quan.
- Sản phẩm có `slug`, `category_id`, `department_id`, `description`, `is_active`, `is_featured`, `average_rating`, `total_reviews`, `sold_count`, `view_count`.
- Admin có CRUD sản phẩm, upload ảnh, bật/tắt bán sản phẩm và biến thể.
- Hệ thống có tối ưu lấy ảnh đại diện bằng `thumbnailImage` và `primaryImage`.
- Hệ thống ghi lượt xem sản phẩm có chống tăng lặp trong một khoảng TTL.

### 3.3 Quản lý danh mục, biến thể, hình ảnh sản phẩm

Chức năng có trong code:

- Danh mục dạng cây qua `parent_id`.
- Lấy danh mục phẳng, cây, chi tiết và sản phẩm theo danh mục.
- Biến thể sản phẩm có size, màu, SKU, giá, tồn kho, tồn kho giữ chỗ, số lượng đã bán.
- Hình ảnh sản phẩm có `url`, `type`, `position`.
- Sản phẩm gắn với `departments`, phù hợp nhóm khoa/bộ phận hoặc đơn vị.

### 3.4 Quản lý giỏ hàng

Chức năng có trong code:

- Giỏ hàng dùng được cho user và guest.
- Guest được định danh qua `guest_token`.
- Thêm sản phẩm vào giỏ, cập nhật số lượng, xóa sản phẩm, đếm số lượng.
- Kiểm tra sản phẩm/biến thể còn active.
- Kiểm tra tồn khả dụng theo `stock - reserved_stock`.
- Tự điều chỉnh số lượng nếu vượt tồn kho.
- Giá giỏ hàng có áp dụng khuyến mãi qua `PromotionPriceService`.

### 3.5 Quản lý đặt hàng/đăng ký mua sản phẩm

Chức năng có trong code:

- Checkout từ các `cart_item_ids` được chọn.
- Hỗ trợ user và guest.
- Tạo order với mã `ORD-YYYYMMDD-xxxxxx`.
- Ghi thông tin người nhận, số điện thoại, địa chỉ.
- Nếu user chọn lưu địa chỉ, hệ thống tạo địa chỉ mới.
- Khi checkout, hệ thống tăng `reserved_stock` để giữ hàng.
- Tạo `order_items` kèm snapshot biến thể, giá gốc, giảm giá, giá cuối, thông tin khuyến mãi.
- Tạo payment pending ngay theo `payment_method`.
- Xóa các cart item đã checkout.
- Với payment online `mock` hoặc `vnpay`, hệ thống đặt `expired_at` và dispatch job hủy đơn nếu quá hạn.

Ghi chú nghiệp vụ:

- Trong code hiện tại, "đăng ký sản phẩm" được triển khai dưới dạng đặt hàng/mua sản phẩm qua giỏ hàng và checkout.
- Không thấy bảng riêng tên `registrations` hoặc `product_registrations`.

### 3.6 Quản lý thanh toán

Chức năng có trong code:

- Thanh toán COD, mock payment và VNPay.
- `PaymentService::pay()` chỉ cho thanh toán đơn đang `pending`.
- Nếu đơn có pending payment, không cho đổi phương thức thanh toán khác với phương thức đã tạo lúc checkout.
- COD giới hạn đơn từ 500.000đ trở xuống.
- Mock/VNPay có callback cập nhật trạng thái payment và order.
- Nếu đơn hết hạn trước khi thanh toán lại, hệ thống release tồn kho, chuyển payment pending sang failed, chuyển order sang cancelled.
- Người dùng có thể xem lịch sử thanh toán, chi tiết payment, summary payment.

Ghi chú:

- Migration `payments.method` có enum gồm `vnpay`, `momo`, `banking`, `baokim`, `mock`, `cod`, nhưng `PaymentService` hiện chỉ xử lý `mock`, `vnpay`, `cod`. Các phương thức `momo`, `banking`, `baokim` chưa xác định luồng xử lý trong mã nguồn hiện tại.

### 3.7 Quản lý đơn hàng và trạng thái đơn hàng

Chức năng có trong code:

- User xem danh sách đơn, chi tiết đơn, bill PDF, yêu cầu hóa đơn VAT giả lập, hủy đơn pending.
- Guest tra cứu đơn bằng order code và thông tin liên quan.
- Admin xem danh sách/chi tiết đơn, cập nhật trạng thái đơn.
- Trạng thái order gồm `pending`, `paid`, `processing`, `shipped`, `completed`, `cancelled`.
- Lịch sử trạng thái lưu trong `order_status_histories`.
- Timeline user ưu tiên lấy mốc từ `order_status_histories`.
- Admin status transition phụ thuộc payment method:
  - COD: `pending -> processing/cancelled`.
  - Online: `pending -> paid/cancelled`.
  - `paid -> processing/cancelled`.
  - `processing -> shipped/cancelled`.
  - `shipped -> completed`.
- Khi completed, hệ thống giảm `reserved_stock`, tăng `sold_stock`, đánh dấu COD pending payment thành success nếu cần.
- Khi cancelled, hệ thống release tồn kho và cập nhật payment pending thành failed.

### 3.8 Quản lý khuyến mãi/voucher

Chức năng có trong code:

- Danh sách khuyến mãi công khai.
- Chi tiết khuyến mãi.
- Danh sách sản phẩm thuộc khuyến mãi.
- Admin CRUD khuyến mãi.
- Admin thêm/xóa/cập nhật sản phẩm hoặc biến thể áp dụng khuyến mãi.
- Khuyến mãi có `discount_type`, `discount_value`, `start_date`, `end_date`, `status`, `is_active`.
- Promotion item có giới hạn số lượng, số đã bán và số đang giữ chỗ.
- Giá sản phẩm/giỏ hàng/order item có tính khuyến mãi.

Chưa xác định trong mã nguồn:

- Chưa thấy luồng nhập mã voucher/code thủ công ở checkout. Hệ thống hiện thiên về chương trình khuyến mãi áp tự động theo sản phẩm/biến thể.

### 3.9 Quản lý nội dung website

Chức năng có trong code:

- Trang chủ lấy dữ liệu qua `/api/home`.
- Nội dung động qua `site_components` và `site_component_items`.
- Admin quản lý site components và item.
- Blog, FAQ, policy, contact, about.
- Form liên hệ lưu vào database và có logic gửi email trong service/controller liên quan.
- Upload ảnh admin qua `/api/admin/uploads/image`.

### 3.10 Chatbot AI tư vấn sản phẩm/đơn hàng/chính sách

Chức năng có trong code:

- Floating AI chat trên frontend.
- Chat session cho user và guest.
- Lưu hội thoại vào `chat_conversations` và `chat_messages`.
- Có tóm tắt hội thoại qua `chat_conversation_summaries`.
- Intent động cho:
  - tìm kiếm/gợi ý sản phẩm,
  - hỏi giá,
  - hỏi tồn kho,
  - hỏi size/màu/biến thể,
  - hỏi khuyến mãi,
  - tra cứu đơn hàng của user đã đăng nhập.
- RAG/file search dùng cho dữ liệu tĩnh do admin upload như FAQ, chính sách, hướng dẫn.
- Admin upload file tri thức lên OpenAI File + Vector Store.
- Admin bật/tắt/xóa tri thức.
- n8n có endpoint sync trạng thái file knowledge đang processing.
- Admin xem danh sách hội thoại, thống kê hội thoại, đóng hội thoại.

Giới hạn quan trọng:

- Chatbot chỉ tra cứu đơn hàng cho user đã đăng nhập trong `OpenAiHybridRagChatService`; guest order qua chatbot chưa xác định trong mã nguồn.
- Nếu chưa cấu hình `OPENAI_API_KEY` hoặc `OPENAI_VECTOR_STORE_ID`, các chức năng tương ứng sẽ lỗi cấu hình.

### 3.11 Tự động hóa n8n/social automation

Chức năng có trong code:

- Admin có thể sinh caption Facebook cho sản phẩm/khuyến mãi bằng OpenAI.
- Admin có thể gửi yêu cầu đăng sản phẩm lên social qua n8n.
- Admin có thể publish khuyến mãi qua n8n.
- Laravel tạo `social_automation_logs`.
- Laravel gửi webhook đến `N8N_SOCIAL_WEBHOOK_URL` kèm secret header.
- n8n callback về `/api/n8n/social/callback`.
- Callback cập nhật trạng thái `success`, `failed`, `skipped`.

Chưa xác định trong mã nguồn:

- Workflow n8n cụ thể bên ngoài repository.
- Nền tảng social thực tế ngoài `facebook`/`all` trong payload/log.

### 3.12 Báo cáo, thống kê, dashboard

Chức năng có trong code:

- Admin dashboard tổng quan.
- Admin analytics gồm overview, behavior overview, behavior chart, revenue by category, top products, top viewed products, sales chart.
- Xuất admin analytics PDF/Excel.
- User analytics gồm overview, orders, spending, interests, order tracking.
- Xuất user analytics PDF/Excel.
- Tracking event qua `/api/analytics/events` có throttle.
- Các event có thể gồm page view, product view, add to cart, checkout, purchase theo service analytics.
- Cập nhật realtime dashboard qua event/broadcast.

## 4. Luồng nghiệp vụ chính

### 4.1 Luồng đăng ký/đăng nhập

1. Người dùng gửi thông tin đăng ký qua frontend `Register.jsx`.
2. Frontend gọi `/api/auth/register`.
3. `AuthController` validate và gọi `AuthService::register`.
4. Backend tạo user mới với role mặc định `user`, hash password, tạo Sanctum token.
5. Người dùng đăng nhập qua `/api/auth/login`.
6. `AuthService::login` kiểm tra email/password, kiểm tra `locked_at`.
7. Nếu request có `guest_token`, hệ thống merge giỏ hàng guest sang user.
8. Backend trả user và token cho frontend.

### 4.2 Luồng xem và tìm kiếm sản phẩm

1. Người dùng vào trang `/shop` hoặc tìm kiếm.
2. Frontend gọi `/api/products` hoặc `/api/search/suggestions`.
3. `ProductService::getList` lọc theo keyword, category, department, giá, size, màu, rating, tồn kho.
4. Sản phẩm chỉ lấy bản ghi active và có biến thể active còn hàng.
5. Kết quả được phân trang và trả kèm filter metadata.
6. Khi xem chi tiết `/product/:slug`, frontend gọi `/api/products/{slug}`.
7. Backend tăng `view_count`, lưu recently viewed cho user, trả ảnh, biến thể, đánh giá, sản phẩm liên quan.

### 4.3 Luồng thêm vào giỏ hàng

1. Người dùng chọn biến thể sản phẩm và số lượng.
2. Frontend gọi `POST /api/cart`.
3. Backend xác định chủ giỏ hàng bằng user hoặc `guest_token`.
4. `CartService::addToCart` khóa biến thể bằng `lockForUpdate`.
5. Backend kiểm tra active, tồn kho khả dụng.
6. Nếu item đã tồn tại thì tăng số lượng; nếu vượt tồn kho thì tự điều chỉnh.
7. Frontend cập nhật lại giỏ hàng/count.

### 4.4 Luồng đặt hàng

1. Người dùng chọn item trong giỏ và nhập thông tin nhận hàng.
2. Frontend gọi `POST /api/orders/checkout`.
3. Backend khóa cart và các product variant liên quan.
4. Backend kiểm tra tồn kho.
5. Backend tạo order pending, tạo mã order code.
6. Backend ghi `order_status_histories` trạng thái pending.
7. Backend tăng `reserved_stock`.
8. Backend tạo `order_items` kèm snapshot giá/biến thể/khuyến mãi.
9. Backend tạo payment pending theo phương thức thanh toán.
10. Backend xóa cart item đã checkout.
11. Nếu online payment, dispatch job tự hủy đơn khi hết hạn.

### 4.5 Luồng thanh toán COD

1. Checkout tạo order và payment pending với method `cod`.
2. `PaymentService::resolveGateway` trả kết quả COD không cần callback.
3. Admin chuyển trạng thái đơn từ `pending` sang `processing`, sau đó `shipped`, `completed`.
4. Khi completed, nếu payment COD còn pending thì cập nhật thành success.

### 4.6 Luồng thanh toán mock payment

1. Checkout tạo payment pending method `mock`.
2. Người dùng gọi `POST /api/orders/{id}/pay` hoặc vào trang QR mock.
3. `MockPaymentGatewayService::create` tạo dữ liệu thanh toán giả lập.
4. Khi callback mock thành công/thất bại, backend cập nhật payment, order status/history.
5. Nếu quá hạn, job hoặc `PaymentService::pay` release tồn kho và hủy đơn.

### 4.7 Luồng thanh toán VNPay

1. Checkout tạo payment pending method `vnpay`.
2. Người dùng gọi pay, `VNPayService::create` tạo URL thanh toán.
3. Người dùng chuyển sang cổng VNPay.
4. VNPay callback về `/api/payment/callback`.
5. Backend kiểm tra dữ liệu callback, cập nhật payment, order status/history.
6. Kết quả hiển thị ở `/payment/result`.

### 4.8 Luồng quản trị cập nhật trạng thái đơn hàng

1. Admin vào `/admin/orders`.
2. Frontend gọi `/api/admin/orders`.
3. Admin mở chi tiết và cập nhật status qua `PATCH /api/admin/orders/{id}/status`.
4. `AdminOrderService` kiểm tra rule chuyển trạng thái.
5. Nếu cancelled, hệ thống release tồn kho và cập nhật payment pending failed.
6. Nếu completed, hệ thống chuyển reserved stock sang sold stock, ghi inventory history, track purchase completed.
7. Backend ghi `order_status_histories` và gửi notification.

### 4.9 Luồng chatbot trả lời câu hỏi

1. User/guest gửi tin nhắn qua floating chat.
2. Frontend gọi `/api/chat/send`.
3. Backend tạo hoặc lấy chat session hiện tại.
4. Tin nhắn user được lưu vào `chat_messages`.
5. `OpenAiHybridRagChatService` nhận diện intent.
6. Với intent sản phẩm/giá/tồn kho/khuyến mãi, service gọi tool nội bộ lấy dữ liệu database.
7. Với intent đơn hàng, service tra đơn hàng của user đã đăng nhập.
8. Với câu hỏi chính sách/tài liệu tĩnh, service gọi OpenAI Responses API kèm file search nếu có vector store.
9. Câu trả lời assistant được lưu vào database cùng sources/tool_calls/metadata.
10. Nếu số tin nhắn đạt ngưỡng, dispatch job tóm tắt hội thoại.

### 4.10 Luồng cập nhật dữ liệu tri thức AI/vector store

1. Admin vào `/admin/chat-knowledge`.
2. Admin upload file qua `/api/admin/chat/knowledge/upload`.
3. Backend tạo `chat_knowledge_files` status `processing`.
4. Backend upload file lên OpenAI Files API.
5. Backend gắn file vào OpenAI Vector Store.
6. Backend lưu `openai_file_id`, `vector_store_id`, `vector_store_file_id`, status.
7. n8n hoặc admin có thể gọi sync status để cập nhật trạng thái file.
8. File active/completed được dùng làm nguồn file search cho chatbot.

### 4.11 Luồng tự động tạo/đăng nội dung social qua n8n

1. Admin tạo hoặc chọn sản phẩm/khuyến mãi.
2. Admin gọi API sinh caption Facebook nếu cần.
3. Backend gọi OpenAI để tạo caption theo dữ liệu sản phẩm/khuyến mãi.
4. Admin gọi publish/post social.
5. Backend tạo `social_automation_logs`.
6. Backend gửi webhook sang n8n kèm payload và callback URL.
7. n8n xử lý đăng bài bên ngoài và callback về Laravel.
8. Laravel cập nhật log thành success/failed/skipped.

## 5. Thiết kế dữ liệu

### 5.1 Bảng dữ liệu chính

| STT | Tên bảng | Mục đích | Khóa chính | Khóa ngoại | Ghi chú |
|---:|---|---|---|---|---|
| 1 | `users` | Lưu tài khoản user/admin | `id` | Không | Có `role`, `mssv`, `locked_at`, soft delete |
| 2 | `personal_access_tokens` | Token Laravel Sanctum | `id` | `tokenable_id` đa hình | Phục vụ API auth |
| 3 | `password_reset_tokens` | Token đặt lại mật khẩu | `email` | Không | Laravel password reset |
| 4 | `addresses` | Địa chỉ người dùng | `id` | `user_id` | Có địa chỉ mặc định |
| 5 | `categories` | Danh mục sản phẩm | `id` | `parent_id` tự tham chiếu | Hỗ trợ cây danh mục |
| 6 | `departments` | Khoa/bộ phận/đơn vị | `id` | Không | Sản phẩm có thể thuộc department |
| 7 | `products` | Sản phẩm thương hiệu | `id` | `category_id`, `department_id` | Có slug, active, featured, rating, view/sold count |
| 8 | `product_images` | Ảnh sản phẩm | `id` | `product_id` | Có `type`, `position` |
| 9 | `product_variants` | Biến thể sản phẩm | `id` | `product_id` | Size, color, SKU, giá, stock, reserved, sold |
| 10 | `carts` | Giỏ hàng | `id` | `user_id` | Hỗ trợ guest qua `guest_token` |
| 11 | `cart_items` | Sản phẩm trong giỏ | `id` | `cart_id`, `product_variant_id` | Có quantity, selected |
| 12 | `promotions` | Chương trình khuyến mãi | `id` | Không | Có thời gian, trạng thái, loại giảm |
| 13 | `promotion_items` | Sản phẩm/biến thể áp dụng khuyến mãi | `id` | `promotion_id`, `product_id`, `product_variant_id` | Có limit, sold, reserved |
| 14 | `orders` | Đơn đặt hàng/đăng ký mua sản phẩm | `id` | `user_id` | Hỗ trợ guest, order code, status, tổng tiền |
| 15 | `order_items` | Chi tiết đơn hàng | `id` | `order_id`, `product_variant_id`, `promotion_id` | Lưu snapshot biến thể/khuyến mãi |
| 16 | `payments` | Giao dịch thanh toán | `id` | `order_id` | Method/status/amount/transaction/meta |
| 17 | `order_status_histories` | Lịch sử trạng thái đơn | `id` | `order_id`, `changed_by` | Nguồn cho timeline |
| 18 | `inventory_histories` | Lịch sử thay đổi tồn kho | `id` | `product_variant_id`, `order_id`, `actor_id` | Ghi reserve/release/complete |
| 19 | `reviews` | Đánh giá sản phẩm | `id` | `user_id`, `product_id`, `order_id`, `order_item_id` | Chỉ sau đơn completed theo logic frontend/backend |
| 20 | `review_images` | Ảnh đánh giá | `id` | `review_id` | Lưu URL ảnh |
| 21 | `notifications` | Thông báo người dùng | `id` | `user_id` | Đơn hàng, hệ thống |
| 22 | `recently_viewed_products` | Sản phẩm đã xem | `id` | `user_id`, `product_id` | Dùng cho user đăng nhập |
| 23 | `search_histories` | Lịch sử tìm kiếm | `id` | `user_id` | User auth |
| 24 | `faqs` | Câu hỏi thường gặp | `id` | Không | Có category, active |
| 25 | `blogs` | Bài viết | `id` | Không | Có slug, category, status |
| 26 | `policies` | Chính sách | `id` | Không | Có type, active |
| 27 | `contacts` | Liên hệ/form góp ý | `id` | Không | Lưu nội dung liên hệ |
| 28 | `abouts` | Nội dung giới thiệu | `id` | Không | Có gallery, active |
| 29 | `site_components` | Component nội dung website | `id` | Không | Quản lý nội dung động |
| 30 | `site_component_items` | Item của component website | `id` | `component_id`, `parent_id` | Hỗ trợ cây item/nội dung |
| 31 | `system_settings` | Cấu hình hệ thống | `id` | Không | Có auto cancel minutes, maintenance |
| 32 | `analytics_events` | Sự kiện hành vi | `id` | Có thể có user/session/product/order | Dùng cho dashboard |
| 33 | `analytics_daily_metrics` | Tổng hợp chỉ số theo ngày | `id` | Không | Dùng cho thống kê nhanh |
| 34 | `user_analytics` | Chưa thấy bảng riêng | Chưa xác định | Chưa xác định | User analytics tính từ orders/events |
| 35 | `chat_conversations` | Hội thoại chatbot | `id` | `user_id` | Hỗ trợ guest token |
| 36 | `chat_messages` | Tin nhắn chatbot | `id` | `conversation_id`, `parent_message_id` | Lưu sources/tool calls/metadata |
| 37 | `chat_conversation_summaries` | Tóm tắt hội thoại | `id` | `conversation_id` | Giảm context gửi AI |
| 38 | `chat_knowledge_files` | Metadata file tri thức AI | `id` | `uploaded_by` | Lưu OpenAI file/vector IDs |
| 39 | `chat_histories` | Lịch sử chat cũ | `id` | `user_id` | Có thể là luồng cũ, vẫn tồn tại migration/model |
| 40 | `social_automation_logs` | Log tự động hóa social | `id` | Không rõ FK cứng | Lưu entity type/id, payload, response |
| 41 | `vat_invoice_requests` | Yêu cầu hóa đơn VAT giả lập | `id` | `order_id`, `user_id` | Có thông tin công ty, tax code, status |
| 42 | `jobs` | Queue jobs database | `id` | Không | Laravel queue |
| 43 | `failed_jobs` | Job thất bại | `id` | Không | Laravel queue failed |

### 5.2 Quan hệ dữ liệu quan trọng

- `users` 1-n `addresses`, `orders`, `reviews`, `notifications`, `search_histories`.
- `categories` có quan hệ cha-con qua `parent_id`.
- `categories` 1-n `products`.
- `departments` 1-n `products`.
- `products` 1-n `product_images`, `product_variants`, `reviews`, `promotion_items`.
- `carts` 1-n `cart_items`; `cart_items` n-1 `product_variants`.
- `orders` 1-n `order_items`, `payments`, `reviews`, `order_status_histories`.
- `order_items` n-1 `product_variants`; đồng thời lưu snapshot để không phụ thuộc hoàn toàn vào dữ liệu sản phẩm hiện tại.
- `payments` n-1 `orders`.
- `promotions` 1-n `promotion_items`.
- `promotion_items` n-1 `products` và có thể n-1 `product_variants`.
- `reviews` 1-n `review_images`.
- `chat_conversations` 1-n `chat_messages`, 1-1 `chat_conversation_summaries`.
- `chat_knowledge_files` n-1 `users` qua `uploaded_by`.
- `site_components` 1-n `site_component_items`; item có thể tự tham chiếu cha-con.

## 6. API và Controller chính

### 6.1 API công khai

| Route/API | Method | Controller | Chức năng | Quyền dùng |
|---|---|---|---|---|
| `/api/auth/register` | POST | `AuthController@register` | Đăng ký | Public |
| `/api/auth/login` | POST | `AuthController@login` | Đăng nhập | Public |
| `/api/auth/forgot-password` | POST | `PasswordResetController@forgot` | Quên mật khẩu | Public |
| `/api/auth/reset-password` | POST | `PasswordResetController@reset` | Đặt lại mật khẩu | Public |
| `/api/home` | GET | `HomeController@getHomeData` | Dữ liệu trang chủ | Public |
| `/api/site-content` | GET | `HomeController@siteContent` | Nội dung site | Public |
| `/api/products` | GET | `ProductController@index` | Danh sách/lọc sản phẩm | Public |
| `/api/products/{slug}` | GET | `ProductController@show` | Chi tiết sản phẩm | Public |
| `/api/products/{id}/variants` | GET | `ProductController@variants` | Biến thể sản phẩm | Public |
| `/api/products/{id}/reviews` | GET | `ReviewController@productReviews` | Đánh giá sản phẩm | Public |
| `/api/categories` | GET | `CategoryController@index` | Danh mục phẳng | Public |
| `/api/categories/tree` | GET | `CategoryController@tree` | Cây danh mục | Public |
| `/api/promotions` | GET | `PromotionController@index` | Danh sách khuyến mãi | Public |
| `/api/promotions/{slug}` | GET | `PromotionController@show` | Chi tiết khuyến mãi | Public |
| `/api/promotions/{slug}/products` | GET | `PromotionController@products` | Sản phẩm khuyến mãi | Public |
| `/api/cart` | GET/POST | `CartController@index/store` | Xem/thêm giỏ hàng | Guest/User |
| `/api/cart/{id}` | PUT/DELETE | `CartController@update/destroy` | Sửa/xóa giỏ hàng | Guest/User |
| `/api/cart/count` | GET | `CartController@count` | Đếm giỏ hàng | Guest/User |
| `/api/orders/checkout` | POST | `OrderController@checkout` | Tạo đơn hàng | Guest/User |
| `/api/orders/{id}/pay` | POST | `PaymentController@pay` | Thanh toán đơn | Guest/User nếu hợp lệ |
| `/api/payment/callback` | GET/POST | `PaymentController@callback` | Callback thanh toán | Payment gateway |
| `/api/guest/orders/lookup` | POST | `GuestOrderController@lookup` | Tra cứu đơn guest | Public |
| `/api/guest/orders/{orderCode}` | GET | `GuestOrderController@showByCode` | Chi tiết đơn guest | Public/Guest token |
| `/api/faqs` | GET | `FaqController@index` | FAQ | Public |
| `/api/blogs` | GET | `BlogController@index` | Blog | Public |
| `/api/policies` | GET | `PolicyController@index` | Chính sách | Public |
| `/api/contact` | POST | `ContactController@submit` | Gửi liên hệ | Public |
| `/api/about` | GET | `AboutController@show` | Giới thiệu | Public |
| `/api/chat/send` | POST | `ChatController@send` | Gửi tin nhắn chatbot | Guest/User |
| `/api/analytics/events` | POST | `AnalyticsEventController@store` | Ghi event hành vi | Public có throttle |

### 6.2 API người dùng đăng nhập

| Route/API | Method | Controller | Chức năng | Quyền dùng |
|---|---|---|---|---|
| `/api/me` | GET/PUT/POST | `AuthController@me/update` | Hồ sơ cá nhân | User |
| `/api/logout` | POST | `AuthController@logout` | Đăng xuất | User |
| `/api/orders` | GET | `OrderController@myOrders` | Đơn hàng của tôi | User |
| `/api/orders/{id}` | GET | `OrderController@show` | Chi tiết đơn | User sở hữu |
| `/api/orders/{id}/cancel` | POST | `OrderController@cancel` | Hủy đơn pending | User sở hữu |
| `/api/orders/{id}/bill` | GET | `OrderController@bill` | Tải bill | User sở hữu |
| `/api/orders/{id}/vat-invoice-request` | GET/POST | `OrderController` | Xem/tạo yêu cầu VAT | User sở hữu |
| `/api/payments` | GET | `PaymentController@history` | Lịch sử thanh toán | User |
| `/api/payments/summary` | GET | `PaymentController@summary` | Tổng quan thanh toán | User |
| `/api/payments/{id}` | GET | `PaymentController@show` | Chi tiết payment | User |
| `/api/reviews` | POST | `ReviewController@store` | Tạo đánh giá | User |
| `/api/reviews/{id}` | PUT/POST/DELETE | `ReviewController` | Sửa/xóa đánh giá | User sở hữu |
| `/api/addresses` | GET/POST | `AddressController` | Danh sách/tạo địa chỉ | User |
| `/api/addresses/{id}` | PUT/DELETE | `AddressController` | Sửa/xóa địa chỉ | User sở hữu |
| `/api/notifications` | GET | `NotificationController@index` | Thông báo | User |
| `/api/user/analytics/*` | GET | `UserAnalyticsController` | Thống kê cá nhân | User |

### 6.3 API quản trị

| Route/API | Method | Controller | Chức năng | Quyền dùng |
|---|---|---|---|---|
| `/api/admin/products` | GET/POST | `AdminProductController` | Danh sách/tạo sản phẩm | Admin |
| `/api/admin/products/{id}` | GET/POST/DELETE | `AdminProductController` | Chi tiết/cập nhật/xóa sản phẩm | Admin |
| `/api/admin/products/{id}/toggle-sale` | POST | `AdminProductController` | Bật/tắt bán sản phẩm | Admin |
| `/api/admin/products/variants/{id}/toggle-sale` | POST | `AdminProductController` | Bật/tắt bán biến thể | Admin |
| `/api/admin/products/{id}/facebook-caption` | POST | `AdminProductController` | Sinh caption sản phẩm | Admin |
| `/api/admin/products/{id}/post-facebook` | POST | `AdminProductController` | Gửi social automation sản phẩm | Admin |
| `/api/admin/orders` | GET | `AdminOrderController@index` | Danh sách đơn hàng | Admin |
| `/api/admin/orders/{id}` | GET | `AdminOrderController@show` | Chi tiết đơn hàng | Admin |
| `/api/admin/orders/{id}/status` | PATCH | `AdminOrderController@updateStatus` | Cập nhật trạng thái đơn | Admin |
| `/api/admin/promotions` | GET/POST | `AdminPromotionController` | Danh sách/tạo khuyến mãi | Admin |
| `/api/admin/promotions/{id}` | GET/PUT/DELETE | `AdminPromotionController` | Chi tiết/cập nhật/xóa khuyến mãi | Admin |
| `/api/admin/promotions/{id}/items` | GET/POST | `AdminPromotionController` | Quản lý item khuyến mãi | Admin |
| `/api/admin/promotions/{id}/facebook-caption` | POST | `AdminPromotionController` | Sinh caption khuyến mãi | Admin |
| `/api/admin/promotions/{id}/publish-social` | POST | `AdminPromotionController` | Gửi social automation khuyến mãi | Admin |
| `/api/admin/users` | GET | `AdminUserController@index` | Danh sách user | Admin |
| `/api/admin/users/{id}/role` | PATCH | `AdminUserController@updateRole` | Đổi role | Admin |
| `/api/admin/users/{id}/lock` | PATCH | `AdminUserController@lock` | Khóa user | Admin |
| `/api/admin/reviews` | GET | `AdminReviewController@index` | Quản lý đánh giá | Admin |
| `/api/admin/site-components` | GET/POST | `AdminSiteContentController` | Quản lý nội dung site | Admin |
| `/api/admin/chat/knowledge` | GET | `ChatKnowledgeController@index` | Danh sách tri thức AI | Admin |
| `/api/admin/chat/knowledge/upload` | POST | `ChatKnowledgeController@upload` | Upload tri thức AI | Admin |
| `/api/admin/chat/conversations` | GET | `AdminChatConversationController@index` | Hội thoại AI | Admin |
| `/api/admin/analytics/*` | GET | `AdminAnalyticsController` | Dashboard/thống kê/export | Admin |
| `/api/admin/uploads/image` | POST | `AdminUploadController@image` | Upload ảnh | Admin |

### 6.4 API n8n

| Route/API | Method | Controller | Chức năng | Quyền dùng |
|---|---|---|---|---|
| `/api/n8n/chat/knowledge/sync-status` | POST | `N8nChatKnowledgeController@syncStatus` | Đồng bộ trạng thái knowledge file | n8n, có secret |
| `/api/n8n/social/callback` | POST | `N8nSocialCallbackController@handle` | Callback social automation | n8n, có secret header |

## 7. Use case

| ID | Tên use case | Tác nhân | Mô tả | Ghi chú |
|---|---|---|---|---|
| UC01 | Xem trang chủ | Khách/User | Xem banner, sản phẩm, khuyến mãi, nội dung nổi bật | Dữ liệu từ `/api/home` và site content |
| UC02 | Xem danh sách sản phẩm | Khách/User | Xem sản phẩm active, còn hàng, có phân trang | `/api/products` |
| UC03 | Tìm kiếm/lọc sản phẩm | Khách/User | Tìm theo keyword, danh mục, khoa, giá, size, màu, rating | Có filter metadata |
| UC04 | Xem chi tiết sản phẩm | Khách/User | Xem ảnh, biến thể, giá, tồn kho, đánh giá, liên quan | Ghi view count |
| UC05 | Thêm vào giỏ hàng | Khách/User | Thêm biến thể vào giỏ | Kiểm tra tồn kho |
| UC06 | Cập nhật giỏ hàng | Khách/User | Sửa số lượng/xóa item | Hỗ trợ guest token |
| UC07 | Đăng ký tài khoản | Khách | Tạo tài khoản user | Chưa bắt buộc MSSV trong register |
| UC08 | Đăng nhập | User/Admin | Nhận Sanctum token | Có merge guest cart |
| UC09 | Đặt hàng/đăng ký mua sản phẩm | Khách/User | Checkout item trong giỏ, tạo order | Tạo payment pending |
| UC10 | Thanh toán COD | Khách/User/Admin | Chọn COD, admin xử lý đơn, hoàn tất payment | Giới hạn 500.000đ |
| UC11 | Thanh toán mock | Khách/User | Thanh toán giả lập/QR/callback | Phục vụ demo/sandbox |
| UC12 | Thanh toán VNPay | Khách/User/VNPay | Redirect sang VNPay và nhận callback | Cần cấu hình VNPay |
| UC13 | Theo dõi đơn hàng | User | Xem danh sách, chi tiết, timeline, bill | Auth required |
| UC14 | Tra cứu đơn guest | Khách | Tra cứu đơn bằng order code/thông tin liên quan | Có guest order API |
| UC15 | Hủy đơn | User/Admin | Hủy đơn pending hoặc theo rule admin | Release tồn kho |
| UC16 | Đánh giá sản phẩm | User | Đánh giá sản phẩm đã mua | Gắn order/order item |
| UC17 | Quản trị sản phẩm | Admin | CRUD sản phẩm, ảnh, biến thể, bật/tắt bán | Admin only |
| UC18 | Quản trị đơn hàng | Admin | Xem lọc đơn, cập nhật trạng thái | Có allowed next statuses |
| UC19 | Quản trị khuyến mãi | Admin | CRUD khuyến mãi, item áp dụng | Có publish social |
| UC20 | Quản trị người dùng | Admin | Xem, khóa/mở, đổi role, xóa/khôi phục | Admin only |
| UC21 | Quản trị nội dung website | Admin | Quản lý site component, blog/FAQ/policy liên quan | Một số public API đọc |
| UC22 | Chatbot tư vấn | Khách/User | Hỏi sản phẩm, giá, tồn kho, khuyến mãi, chính sách | User mới tra được đơn cá nhân |
| UC23 | Quản trị tri thức chatbot | Admin | Upload/bật tắt/xóa file vector store | Cần OpenAI config |
| UC24 | Xem dashboard | Admin | Xem doanh thu, đơn hàng, hành vi, top sản phẩm | Có export PDF/Excel |
| UC25 | Tự động đăng social | Admin/n8n | Tạo caption và gửi webhook n8n | Workflow n8n ngoài repo |

## 8. Yêu cầu chức năng và phi chức năng

### 8.1 Yêu cầu chức năng

| Mã | Yêu cầu chức năng | Tình trạng theo code |
|---|---|---|
| FR01 | Người dùng có thể đăng ký, đăng nhập, đăng xuất | Có |
| FR02 | Người dùng có thể cập nhật hồ sơ và avatar | Có |
| FR03 | Người dùng có thể quản lý địa chỉ nhận hàng | Có |
| FR04 | Khách và user có thể xem/tìm kiếm/lọc sản phẩm | Có |
| FR05 | Khách và user có thể xem chi tiết sản phẩm | Có |
| FR06 | Khách và user có thể thêm sản phẩm vào giỏ | Có |
| FR07 | Khách và user có thể đặt hàng từ giỏ | Có |
| FR08 | Hệ thống kiểm tra và giữ tồn kho khi checkout | Có |
| FR09 | Hệ thống hỗ trợ COD, VNPay, mock payment | Có |
| FR10 | Người dùng có thể theo dõi đơn hàng và timeline | Có |
| FR11 | Người dùng có thể hủy đơn đang pending | Có |
| FR12 | Người dùng có thể đánh giá sản phẩm đã mua | Có |
| FR13 | Admin có thể quản lý sản phẩm, biến thể, ảnh | Có |
| FR14 | Admin có thể quản lý đơn hàng và trạng thái | Có |
| FR15 | Admin có thể quản lý khuyến mãi | Có |
| FR16 | Admin có thể quản lý người dùng | Có |
| FR17 | Admin có thể quản lý nội dung website | Có |
| FR18 | Admin có thể xem dashboard, analytics, export | Có |
| FR19 | Chatbot có thể tư vấn sản phẩm/giá/tồn kho/khuyến mãi | Có |
| FR20 | Chatbot có thể trả lời theo tài liệu tri thức | Có, nếu có OpenAI/vector store |
| FR21 | Hệ thống có social automation qua n8n | Có |
| FR22 | Xác minh sinh viên bằng hệ thống Trường | Chưa xác định trong mã nguồn |
| FR23 | Nhập mã voucher thủ công ở checkout | Chưa xác định trong mã nguồn |

### 8.2 Yêu cầu phi chức năng

| Nhóm | Yêu cầu | Cơ sở trong code |
|---|---|---|
| Bảo mật | API user/admin phải dùng token | Laravel Sanctum, middleware `auth:sanctum` |
| Bảo mật | Admin API phải kiểm tra role | `AdminMiddleware`, `AdminRoute` |
| Bảo mật | Mật khẩu phải hash | `Hash::make`, cast `password` hashed |
| Bảo mật | Callback/webhook cần secret | n8n social và AI sync có secret config |
| Bảo mật | Token reset password qua email | `PasswordResetController`, User notification |
| Hiệu năng | Giảm overfetch product list | `formatProductSummary`, thumbnail relation |
| Hiệu năng | Giới hạn phân trang | Clamp `per_page` ở nhiều service |
| Hiệu năng | Cache filter metadata/category/home | Có dùng Cache trong product/home |
| Hiệu năng | Queue xử lý nền | `jobs`, `CancelPendingOrderJob`, summary/social jobs |
| Tính mở rộng | Tách Controller-Service-Model | Đa số nghiệp vụ nằm ở service |
| Tính mở rộng | Tách gateway thanh toán | `MockPaymentGatewayService`, `VNPayService` |
| Tính mở rộng | Tách AI/vector/social service | Có service riêng |
| Tính dễ dùng | SPA có trang user/admin riêng | React routes rõ ràng |
| Độ tin cậy | Dùng transaction khi checkout/payment/status | `DB::transaction` |
| Toàn vẹn dữ liệu | Khóa dòng tồn kho khi checkout/cart/pay | `lockForUpdate` ở variant/order/cart |
| Toàn vẹn dữ liệu | Lưu snapshot order item | `variant_snapshot`, `promotion_snapshot` |
| Khả dụng | Chế độ maintenance có cấu hình | `system_settings` |

## 9. Kiểm thử

| ID | Tên kiểm thử | Mục tiêu | Cách đo | Kết quả mong đợi |
|---|---|---|---|---|
| TC01 | Đăng ký tài khoản | Kiểm tra tạo user và token | Gửi POST `/api/auth/register` hợp lệ | Trả success, có user và token |
| TC02 | Đăng nhập sai mật khẩu | Kiểm tra bảo mật auth | Gửi password sai | Trả lỗi 401 |
| TC03 | Login merge guest cart | Kiểm tra giỏ guest chuyển sang user | Thêm cart bằng guest token rồi login | Cart user có item guest |
| TC04 | Lọc sản phẩm theo keyword | Kiểm tra tìm kiếm sản phẩm | Gọi `/api/products?keyword=...` | Chỉ trả sản phẩm phù hợp |
| TC05 | Lọc theo danh mục cha | Kiểm tra lấy sản phẩm danh mục con | Gọi category cha | Có sản phẩm thuộc danh mục con |
| TC06 | Thêm vào giỏ vượt tồn kho | Kiểm tra kiểm soát tồn kho | Thêm quantity lớn hơn available | Số lượng được điều chỉnh hoặc báo lỗi |
| TC07 | Checkout thành công | Kiểm tra tạo order | Checkout cart item hợp lệ | Có order, order item, payment pending |
| TC08 | Checkout thiếu tồn kho | Kiểm tra không bán quá tồn | Giảm stock trước checkout | Trả lỗi không đủ hàng |
| TC09 | COD vượt giới hạn | Kiểm tra rule COD | Tạo đơn COD > 500.000đ | Trả lỗi không cho COD |
| TC10 | Pay lại sai method | Kiểm tra không đổi phương thức giữa chừng | Order có pending vnpay, gọi pay mock | Trả lỗi 409 |
| TC11 | Callback mock success | Kiểm tra thanh toán giả lập | Gọi callback mock success | Payment success, order cập nhật phù hợp |
| TC12 | Callback VNPay | Kiểm tra gateway VNPay | Giả lập callback hợp lệ | Payment/order/history cập nhật |
| TC13 | Đơn online hết hạn | Kiểm tra auto cancel | Tạo đơn online và quá expired_at | Order cancelled, stock release |
| TC14 | Admin chuyển trạng thái COD | Kiểm tra transition COD | pending COD -> processing -> shipped -> completed | Thành công theo từng bước |
| TC15 | Admin chuyển sai trạng thái | Kiểm tra rule trạng thái | pending COD -> paid | Trả lỗi không hợp lệ |
| TC16 | Completed cập nhật tồn kho | Kiểm tra reserved/sold | Hoàn tất đơn shipped | reserved giảm, sold tăng |
| TC17 | User hủy đơn pending | Kiểm tra cancel | Gọi `/orders/{id}/cancel` | Order cancelled, payment failed |
| TC18 | User đánh giá sản phẩm | Kiểm tra review | Đơn completed, tạo review | Review được lưu và hiện ở sản phẩm |
| TC19 | Admin quản lý sản phẩm | Kiểm tra CRUD sản phẩm | Tạo/sửa/xóa qua admin API | Dữ liệu cập nhật đúng |
| TC20 | Admin quản lý khuyến mãi | Kiểm tra promotion item | Tạo promotion và gắn sản phẩm | Giá sản phẩm/giỏ có khuyến mãi |
| TC21 | Chatbot hỏi sản phẩm | Kiểm tra intent product_search | Gửi câu hỏi có tên sản phẩm | Trả sản phẩm từ DB |
| TC22 | Chatbot hỏi đơn hàng | Kiểm tra order_query | User hỏi mã ORD hợp lệ | Trả trạng thái đơn của user |
| TC23 | Upload knowledge | Kiểm tra vector store | Admin upload file | Có bản ghi `chat_knowledge_files`, status cập nhật |
| TC24 | Social automation callback | Kiểm tra n8n callback | Gửi callback hợp lệ | Log cập nhật success/failed |
| TC25 | Admin analytics export | Kiểm tra báo cáo | Gọi export PDF/Excel | Tải file thành công |

KPI đề xuất cần đo khi viết báo cáo:

- Thời gian tải danh sách sản phẩm với số lượng bản ghi mẫu: Cần bổ sung từ người thực hiện.
- Thời gian checkout trung bình: Cần bổ sung từ người thực hiện.
- Tỷ lệ callback thanh toán mock/VNPay thành công trong kịch bản test: Cần bổ sung từ người thực hiện.
- Số lượng người dùng/sản phẩm/đơn hàng dùng trong kiểm thử: Cần bổ sung từ người thực hiện.
- Độ chính xác trả lời chatbot theo bộ câu hỏi mẫu: Cần bổ sung từ người thực hiện.

## 10. Kết quả hệ thống cần chụp ảnh đưa vào báo cáo

| STT | Màn hình/chức năng | Đường dẫn frontend dự kiến | Mục đích minh họa |
|---:|---|---|---|
| 1 | Trang chủ | `/` | Tổng quan cổng dịch vụ số CTUT Store |
| 2 | Danh sách sản phẩm | `/shop` | Sản phẩm thương hiệu, tìm kiếm/lọc |
| 3 | Chi tiết sản phẩm | `/product/:slug` | Ảnh, biến thể, giá, tồn kho, đánh giá |
| 4 | Giỏ hàng | `/cart` | Sản phẩm đã chọn, số lượng, tổng tiền |
| 5 | Thanh toán/checkout | `/checkout` | Thông tin nhận hàng, phương thức thanh toán |
| 6 | QR mock payment | `/payment/qr` | Thanh toán giả lập |
| 7 | Kết quả thanh toán | `/payment/result` hoặc `/order-success/:orderId` | Xác nhận kết quả đặt hàng/thanh toán |
| 8 | Đơn hàng của người dùng | `/account/orders` | Theo dõi đơn hàng |
| 9 | Chi tiết đơn hàng người dùng | `/account/orders/:id` | Timeline, thanh toán, item, bill |
| 10 | Hồ sơ/địa chỉ người dùng | `/account/profile`, `/account/addresses` | Quản lý thông tin người dùng |
| 11 | Admin dashboard | `/admin/dashboard` | Tổng quan quản trị |
| 12 | Admin analytics | `/admin/analytics` | Biểu đồ, funnel, top product, export |
| 13 | Quản lý sản phẩm | `/admin/products` | CRUD sản phẩm/biến thể/ảnh |
| 14 | Quản lý đơn hàng | `/admin/orders` | Lọc đơn, cập nhật trạng thái |
| 15 | Quản lý khuyến mãi | `/admin/promotions` | Promotion và sản phẩm áp dụng |
| 16 | Quản lý người dùng | `/admin/users` | Role, khóa/mở tài khoản |
| 17 | Quản lý đánh giá | `/admin/reviews` | Ẩn/hiện/xóa review |
| 18 | Quản lý nội dung website | `/admin/site-content` | Site components/items |
| 19 | Chatbot AI trên website | Floating chat | Tư vấn sản phẩm/chính sách |
| 20 | Quản lý tri thức AI | `/admin/chat-knowledge` | Upload/sync/toggle knowledge file |
| 21 | Quản lý hội thoại AI | `/admin/chat-conversations` | Xem lịch sử hội thoại |
| 22 | Social automation sản phẩm | Trong admin products | Sinh caption/post Facebook |
| 23 | Social automation khuyến mãi | Trong admin promotions | Publish khuyến mãi qua n8n |
| 24 | n8n workflow | Ngoài mã nguồn Laravel/React | Cần bổ sung ảnh từ người thực hiện |

## 11. Nhận xét phạm vi và điểm cần bổ sung khi viết báo cáo

Các điểm đã có thể trình bày chắc chắn:

- Hệ thống là cổng dịch vụ số thương mại/đăng ký sản phẩm có đầy đủ luồng xem sản phẩm, giỏ hàng, đặt hàng, thanh toán và theo dõi đơn.
- Có quản trị sản phẩm, đơn hàng, khuyến mãi, người dùng, đánh giá, nội dung website.
- Có phân tích hành vi và dashboard phục vụ quản lý.
- Có tích hợp AI chatbot, OpenAI vector store và n8n social automation.
- Có cơ chế đảm bảo toàn vẹn nghiệp vụ như transaction, lock tồn kho, reserved stock, order status history.

Các điểm cần bổ sung từ người thực hiện:

- Số liệu thực nghiệm: số user, số sản phẩm, số đơn test, thời gian phản hồi, kết quả kiểm thử.
- Môi trường triển khai chính thức: server, domain, MySQL version, PHP version triển khai.
- Quy trình xác minh sinh viên nếu đề tài yêu cầu chặt chẽ theo MSSV.
- Quy trình nghiệp vụ thực tế của Trường khi duyệt/xác nhận sản phẩm thương hiệu, nếu có ngoài hệ thống.
- Ảnh workflow n8n thực tế và cấu hình VNPay sandbox/thật.
- Bộ câu hỏi kiểm thử chatbot và đánh giá chất lượng câu trả lời.

