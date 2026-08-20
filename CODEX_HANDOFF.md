# CODEX_HANDOFF.md

## Cap nhat nhanh 2026-08-04 - nang cap QR mock bank va them GPT fallback cho chatbot

* Da doi man `mock_bank` QR tu dang `FakeQr` tu ve thanh anh QR ngan hang that qua dich vu `img.vietqr.io`.
* Luong thanh toan `mock_bank` khong doi callback hay nghiep vu:
  * van giu `completePayment()`
  * van quay ve `callbackUrl` nhu cu
* Giao dien QR moi hien:
  * ten ngan hang
  * chu tai khoan
  * so tai khoan
  * so tien
  * noi dung chuyen khoan
  * nut copy so tai khoan va noi dung
* Neu anh QR ngoai khong tai duoc, FE co fallback hien thong tin chuyen khoan thu cong de tranh vo luong thanh toan.
* Chatbot da duoc nang cap theo huong hybrid classify:
  * rule-based van la lop guard dau tien
  * GPT chi duoc goi khi cau hoi mo ho, confidence thap hoac roi vao `clarify/rag`
  * du lieu dong van duoc chan de uu tien database, tranh cho GPT day nham sang `static_knowledge`
* Da bo sung config moi trong `config/services.php`:
  * `openai.intent_classifier_enabled`
  * `openai.intent_classifier_threshold`
* `OpenAiHybridRagChatService` hien co:
  * `refineEntitiesWithGpt()`
  * `shouldUseGptIntentClassifier()`
  * `classifyIntentWithGpt()`
  * `parseIntentClassifierPayload()`
  * `intentClassifierPrompt()`
* Da kiem tra:
  * `php -l app/Services/Chat/OpenAiHybridRagChatService.php`
  * `php -l config/services.php`
  * `vite build`
* File da thay doi o buoc nay:
  * `app/Services/Chat/OpenAiHybridRagChatService.php`
  * `config/services.php`
  * `resources/js/pages/MockPaymentQr.jsx`
  * `CODEX_HANDOFF.md`

## Cap nhat nhanh 2026-08-01 - chinh lai module admin Khuyen mai theo nghiep vu moi

* Da chinh backend admin khuyen mai theo huong:
  * tach bo loc `status` (draft/active/inactive) va `progress` (active/ending_soon/upcoming/ended)
  * bo validate giam gia cap khuyen mai khi tao/sua khuyen mai
  * luu `discount_type`, `discount_value` cap khuyen mai ve `null`, uu dai se quan ly o tung `promotion_item`
  * khi khuyen mai dang dien ra (`is_item_locked = true`) thi khong cho sua danh sach san pham ap dung
  * khi xoa san pham khoi khuyen mai thi chi tat `is_active = false`, khong xoa cung
  * bo hoan toan `limit_quantity`, khuyen mai se bam truc tiep theo ton kho thuc te cua san pham/bien the
* Da bo sung response admin promotion:
  * `timeline_status`
  * `timeline_status_text`
  * `is_item_locked`
* Da kiem tra luong hinh anh:
  * user list/card dang dung `thumbnail`
  * user detail dang uu tien `banner`
  * vi vay chua xoa field nao de tranh vo giao dien public
* Frontend admin khuyen mai da doi:
  * form khuyen mai bo field giam gia cap chuong trinh
  * bang danh sach them cot `Anh` va cot `Dien bien`
  * draft/da tat hien thi mo hon
  * khuyen mai dang dien ra khoa nut xoa
  * chi tiet khuyen mai doi thao tac `Xoa` item thanh `Tat`
  * modal xac nhan da doi tu `window.confirm` sang `ConfirmDialog`
* Da sua lai font/chuoi module admin khuyen mai ve UTF-8 sach o cac file vua dong vao.
* Da sua them migration goc `create_promotions_table`:
  * `discount_type` -> `nullable()`
  * `discount_value` -> `nullable()`
* Muc dich:
  * khop voi nghiep vu moi la khuyen mai cap chuong trinh khong con luu muc giam gia
  * tranh loi `Column 'discount_type' cannot be null` khi tao khuyen mai moi va chay `migrate:refresh --seed`
* Da kiem tra:
  * `php -l app/Services/Admin/AdminPromotionService.php`
  * `php -l app/Http/Controllers/Api/Admin/AdminPromotionController.php`
  * `php -l database/migrations/2026_04_25_103122_create_promotions_table.php`
  * `vite build`
* File da thay doi o buoc nay:
  * `app/Http/Controllers/Api/Admin/AdminPromotionController.php`
  * `app/Services/Admin/AdminPromotionService.php`
  * `database/migrations/2026_04_25_103122_create_promotions_table.php`
  * `resources/js/admin/mappers/adminPromotionMapper.js`
  * `resources/js/admin/services/adminPromotionService.js`
  * `resources/js/admin/components/promotions/AdminPromotionFormModal.jsx`
  * `resources/js/admin/components/promotions/AdminPromotionItemFormModal.jsx`
  * `resources/js/admin/components/ui/ConfirmDialog.jsx`
  * `resources/js/admin/pages/AdminPromotions.jsx`
  * `resources/js/admin/pages/AdminPromotionDetail.jsx`
  * `CODEX_HANDOFF.md`

## Cap nhat nhanh 2026-08-01 - toi gian hoa module Blog theo luong Tin tuc

* Da chuyen module `Blog` sang mo hinh toi gian, phu hop luong dang tin va huong dan cua CTUT UniShop.
* Da bo sung giao dien tieng Viet co dau cho cac man blog user/admin vua duoc lam moi.
* Form blog admin da doi tu nhap URL anh sang tai anh len qua `POST /api/admin/uploads/image`.
* Sau khi chon anh:
  * FE tai anh len thu muc `blog`
  * hien preview ngay trong form
  * luu lai `thumbnail` bang path tuong doi thay vi URL day du
* Da bo input nhap tay `ngay gio dang bai` o form admin blog:
  * bai `draft` chua co ngay dang
  * bai `published` se tu dong lay `published_at` trong backend
* Da bo sung co che tuong thich blog voi schema du lieu cu:
  * neu bang `blogs` chua co cot `summary` thi service tu fallback sang `excerpt`
  * giup tranh loi lay danh sach blog khi du lieu/migration chua dong bo hoan toan
* Da bo sung fallback them cho schema blog cu:
  * `status` <-> `is_published`
  * `author_id` <-> `author_name`
  * create/update admin blog se tu ghi dung field theo schema DB hien co
* Da sua loi frontend `Navbar` bi dung bien `href` khong ton tai trong `normalizePublicLinks()`, day la nguyen nhan lam trang user bi trang.
* Da sua tiep loi `500` o admin blog do service eager load cot `users.full_name` trong khi DB hien tai chi co `users.name`.
* Hien `AdminBlogService::index()` va `BlogService::list()` da duoc kiem tra truc tiep tren DB va tra ket qua thanh cong.
* Da them rang buoc nghiep vu blog:
  * bai viet dang `published` khong duoc phep xoa
  * muon xoa phai chuyen ve `draft` truoc
* Backend admin blog se tra loi loi nghiep vu neu co request xoa bai dang xuat ban.
* Frontend admin blog da khoa nut `Xoa` voi bai dang xuat ban va hien tooltip/huong dan phu hop.
* Da don them cac nhan user-facing con sot cua module Tin tuc:
  * `Xem Blog` -> `Xem tin tuc`
  * `Blog` o footer -> `Tin tuc`
* Da xoa cac du lieu tinh `MoMo/VNPay` con sot trong mock data frontend de tranh xuat hien lai tren giao dien mau/test.
* Da bo sung normalize label theo route `/blog` o footer/site content de du lieu cu van hien `Tin tuc` thay vi `Blog`.
* Khu admin lien quan menu/noi dung site/blog list cung da doi nhan `Blog` thanh `Tin tuc` de dong bo ten goi.
* Da siet them luong `mock_bank` de tranh tao payment trung khi nguoi dung bam thanh toan lai nhieu lan lien tiep:
  * neu don van con 1 payment `mock_bank` dang `unpaid` thi backend tra lai payment do thay vi tao them ban ghi moi
* Callback `mock_bank` gio chi xu ly 1 lan cho moi payment:
  * payment da `failed/paid/refunded` se khong bi doi trang thai nguoc lai
  * khi 1 payment thanh cong, cac payment `unpaid` con lai cua cung don se bi danh dau `failed` de giu audit va tranh callback tre lam lech du lieu
* Khu `bai viet noi bat` phia user da doi thanh slider, ho tro chuyen qua lai giua nhieu bai viet noi bat.
* Navbar public da doi `Tin tức` va `Tra cứu đơn` sang tieng Viet co dau.
* Da them migration moi:
  * `2026_08_01_090000_simplify_blogs_for_news_flow.php`
* Migration nay bo sung:
  * `author_id`
  * `summary`
  * `status` voi 2 gia tri `draft|published`
  * index theo `status, published_at` va `is_featured, status`
* Migration co backfill du lieu cu:
  * `summary <- excerpt`
  * `status <- is_published`
  * `published_at <- created_at` neu bai viet da xuat ban nhung chua co ngay dang
* Backend public blog da rut gon:
  * `GET /api/blogs`
  * `GET /api/blogs/{slug}`
* Da bo route public cu:
  * `GET /api/blogs/categories`
* Backend admin blog da chuyen sang contract moi:
  * `GET /api/admin/blogs`
  * `POST /api/admin/blogs`
  * `GET /api/admin/blogs/{id}`
  * `POST /api/admin/blogs/{id}`
  * `PATCH /api/admin/blogs/{id}/status`
  * `DELETE /api/admin/blogs/{id}`
* Logic moi cua blog:
  * chi con `draft` va `published`
  * slug tu tao tu `title`
  * bai viet public chi hien khi `status = published` va `published_at <= now()`
  * bai noi bat lay theo `is_featured = true`
  * bai lien quan o chi tiet hien theo bai moi nhat, khong con phu thuoc danh muc
* Frontend user da doi nhan hien thi `Blog` thanh `Tin tuc` tren menu.
* Frontend user da bo:
  * danh muc blog
  * sidebar blog
  * toolbar loc theo danh muc
  * cac thong tin `luot xem`, `thoi gian doc`, `tag`, `chia se`
* Frontend admin da bo:
  * nhap slug thu cong
  * danh muc blog
  * toggle publish cu
* Seeder `BlogSeeder` da doi sang du lieu mau moi:
  * dung `summary`
  * dung `status`
  * dung `author_id`
  * bo view count/read time o noi dung seed
* Luu y:
  * chua xoa migration/bang cu de tranh pha du lieu hien tai
  * can chay lai migration va seeder thu cong sau khi xac nhan
* File da thay doi o buoc nay:
  * `database/migrations/2026_08_01_090000_simplify_blogs_for_news_flow.php`
  * `app/Models/Blog.php`
  * `app/Services/BlogService.php`
  * `app/Http/Controllers/Api/BlogController.php`
  * `app/Services/Admin/AdminBlogService.php`
  * `app/Http/Controllers/Api/Admin/AdminBlogController.php`
  * `database/seeders/BlogSeeder.php`
  * `routes/api.php`
  * `resources/js/services/blogService.js`
  * `resources/js/services/mappers/blogMapper.js`
  * `resources/js/services/mappers/homeMapper.js`
  * `resources/js/components/blog/BlogHero.jsx`
  * `resources/js/components/blog/BlogPostCard.jsx`
  * `resources/js/components/blogDetail/BlogDetailHero.jsx`
  * `resources/js/components/blogDetail/BlogRelatedPosts.jsx`
  * `resources/js/pages/Blog.jsx`
  * `resources/js/pages/BlogDetail.jsx`
  * `resources/js/components/layout/Navbar.jsx`
  * `resources/js/admin/mappers/adminBlogMapper.js`
  * `resources/js/admin/services/adminBlogService.js`
  * `resources/js/admin/pages/AdminBlogs.jsx`
  * `resources/js/admin/layout/AdminSidebar.jsx`
  * `resources/js/admin/layout/AdminTopbar.jsx`
  * `resources/js/app.jsx`
  * `CODEX_HANDOFF.md`

## Cap nhat nhanh 2026-07-31 - them CRUD Blog cho admin

* Da bo sung module admin rieng cho `Blog`, tach biet voi luong blog public.
* Backend admin blog hien co cac API:
  * `GET /api/admin/blogs`
  * `POST /api/admin/blogs`
  * `GET /api/admin/blogs/{id}`
  * `PUT /api/admin/blogs/{id}`
  * `PATCH /api/admin/blogs/{id}/toggle-published`
  * `DELETE /api/admin/blogs/{id}`
* Da them `AdminBlogService` de xu ly:
  * loc theo tu khoa / danh muc / trang thai hien thi / bai viet noi bat
  * tao slug tu dong neu de trong
  * dang/an bai viet
  * xoa mem bai viet
* Frontend admin da co man `/admin/blogs` voi cac chuc nang:
  * xem danh sach
  * loc
  * them moi
  * xem chi tiet
  * chinh sua
  * dang/an bai viet
  * xoa mem
* Da them menu admin `Blog` o sidebar va topbar breadcrumb/title.
* Buoc nay chua dung vao blog public va khong them migration.
* Kiem tra da pass:
  * `php -l app/Services/Admin/AdminBlogService.php`
  * `php -l app/Http/Controllers/Api/Admin/AdminBlogController.php`
  * `vite build`
* File da thay doi o buoc nay:
  * `routes/api.php`
  * `app/Services/Admin/AdminBlogService.php`
  * `app/Http/Controllers/Api/Admin/AdminBlogController.php`
  * `resources/js/app.jsx`
  * `resources/js/admin/layout/AdminSidebar.jsx`
  * `resources/js/admin/layout/AdminTopbar.jsx`
  * `resources/js/admin/mappers/adminBlogMapper.js`
  * `resources/js/admin/services/adminBlogService.js`
  * `resources/js/admin/pages/AdminBlogs.jsx`
  * `CODEX_HANDOFF.md`

## Cập nhật nhanh 2026-07-31 - API contract checkout và order lookup

* Đã gỡ các route public/user không còn dùng cho bill và tải hóa đơn đỏ:
  * `GET /guest/orders/{orderCode}/bill`
  * `GET /guest/orders/{orderCode}/vat-invoice`
  * `GET /orders/{id}/bill`
  * `GET /orders/{id}/vat-invoice`
* `routes/api.php` hiện chỉ giữ luồng tra cứu đơn guest, yêu cầu hóa đơn đỏ và thanh toán theo contract mới.
* Đã sửa `OrderController::cancel()` gọi đúng sang `OrderQueryService::cancel()` để tránh lỗi gọi method không tồn tại ở `OrderService`.
* Đã đồng bộ `OrderQueryService` sang enum mới:
  * `awaiting_receipt` thay cho `shipped`
  * `mock_bank` thay cho `mock/vnpay`
  * `paid/unpaid/failed/refunded` thay cho `success/pending/failed`
  * bổ sung `fulfillment_method` và `payment_status` vào dữ liệu trả về cho user order list/detail
  * pickup location đổi về `Phòng Công tác Chính trị và Quản lý sinh viên`
* Đã đồng bộ `PaymentQueryService` sang payment status mới, chỉ cho retry với `mock_bank` và tắt cờ tải biên nhận ở response payment detail.
* Chưa chạy migration trong bước này.
* File đã thay đổi ở bước này:
  * `routes/api.php`
  * `app/Http/Controllers/Api/OrderController.php`
  * `app/Services/OrderQueryService.php`
  * `app/Services/PaymentQueryService.php`

## Cập nhật nhanh 2026-07-31 - đồng bộ admin order, analytics và notification

* Đã đồng bộ `AdminOrderController` và `AdminOrderService` sang bộ trạng thái đơn mới:
  * `pending`
  * `processing`
  * `awaiting_receipt`
  * `completed`
  * `cancelled`
* Admin không còn dùng các trạng thái cũ `paid`, `shipped` trong cập nhật trạng thái đơn.
* Luồng admin hoàn tất đơn hiện chốt thanh toán offline bằng `payment.status = paid` và `order.payment_status = paid`.
* Luồng admin hủy đơn hiện chuyển `payment_status` của đơn về `failed` nếu đơn chưa thanh toán.
* Đã đồng bộ `NotificationService` để trạng thái `awaiting_receipt` hiển thị khác nhau theo `fulfillment_method`:
  * `delivery` -> thông báo đang giao
  * `pickup` -> thông báo sẵn sàng nhận tại phòng
* Đã đồng bộ `UserAnalyticsService`, `AdminAnalyticsService` và `AnalyticsEventService` sang bộ trạng thái mới, bỏ phụ thuộc vào `shipped` và `paid` như order status cũ.
* File đã thay đổi ở bước này:
  * `app/Http/Controllers/Api/Admin/AdminOrderController.php`
  * `app/Services/Admin/AdminOrderService.php`
  * `app/Services/NotificationService.php`
  * `app/Services/UserAnalyticsService.php`
  * `app/Services/Admin/AdminAnalyticsService.php`
  * `app/Services/Analytics/AnalyticsEventService.php`

## Cập nhật nhanh 2026-07-31 - đồng bộ seeders theo migration checkout mới

* Đã cập nhật các seeder để khớp với migration `2026_04_25_103157_update_orders_payments_and_vat_invoice_requests_for_new_checkout_flow.php`.
* `OrderSeeder` hiện seed theo các field mới:
  * `fulfillment_method`
  * `payment_status`
  * status mới `awaiting_receipt`
* `PaymentSeeder` đã bỏ hoàn toàn các method/trạng thái cũ như `mock`, `vnpay`, `banking`, `pending`, `success` và chuyển sang:
  * `cod`
  * `mock_bank`
  * `cash_on_pickup`
  * `unpaid`
  * `paid`
  * `failed`
* `OrderStatusHistorySeeder` đã bỏ flow cũ `pending -> paid -> processing -> shipped` và chuyển sang flow mới:
  * `pending -> processing -> awaiting_receipt -> completed`
  * hoặc `pending -> cancelled`
* `NotificationSeeder` đã đổi truy vấn payment thành `paid` thay cho `success`.
* File đã thay đổi ở bước này:
  * `database/seeders/OrderSeeder.php`
  * `database/seeders/PaymentSeeder.php`
  * `database/seeders/OrderStatusHistorySeeder.php`
  * `database/seeders/NotificationSeeder.php`

## Cập nhật nhanh 2026-07-31 - gỡ FAQ và Giới thiệu khỏi frontend user

* Đã gỡ route frontend user cho `FAQ` và `Giới thiệu`, không còn truy cập qua router public React.
* Đã gỡ `FAQ` và `Giới thiệu` khỏi menu desktop/mobile của người dùng, kể cả khi navbar đang lấy dữ liệu động từ site content.
* Đã đổi CTA ở trang liên hệ từ `Xem FAQ` sang `Xem chính sách` để tránh điều hướng tới route đã gỡ.
* Backend, database, model và dữ liệu cũ của `FAQ` và `Giới thiệu` vẫn được giữ nguyên, chưa xóa migration hay service.
* File đã thay đổi ở bước này:
  * `resources/js/app.jsx`
  * `resources/js/components/layout/Navbar.jsx`
  * `resources/js/components/contact/ContactSupport.jsx`

## Cập nhật nhanh 2026-07-31 - thêm trang tra cứu đơn cho khách

* Đã thêm route frontend public `/guest-order-lookup` cho khách chưa đăng nhập tra cứu đơn hàng.
* Trang tra cứu mới hỗ trợ đúng 2 cách:
  * `order_code + email` để tra cứu một đơn cụ thể
  * `phone + email` để xem danh sách lịch sử đơn hàng
* Validate phía frontend hiển thị ngay dưới từng input với thông điệp tiếng Việt rõ ràng.
* Kết quả tra cứu theo `phone + email` cho phép chọn từng đơn và xem nhanh chi tiết ngay trên cùng trang.
* Đã bổ sung mục `Tra cứu đơn` vào menu desktop/mobile public để người dùng dễ truy cập.
* Đã cập nhật mapper/service frontend để xử lý đúng response `lookup_type = phone_email`, không còn ép dữ liệu danh sách về format chi tiết một đơn.
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `resources/js/app.jsx`
  * `resources/js/components/layout/Navbar.jsx`
  * `resources/js/services/guestOrderService.js`
  * `resources/js/services/mappers/orderMapper.js`
  * `resources/js/pages/GuestOrderLookup.jsx`

## Cập nhật nhanh 2026-07-31 - cuộn danh sách sản phẩm trong chi tiết đơn

* Đã giới hạn chiều cao danh sách sản phẩm và cho cuộn nội bộ khi đơn có nhiều sản phẩm.
* Áp dụng cho cả:
  * màn tra cứu đơn guest `GuestOrderLookup`
  * màn chi tiết đơn của người dùng đã đăng nhập `AccountOrderDetail`
* Chỉ thay đổi hiển thị giao diện, không đổi dữ liệu hay logic đơn hàng.
* File đã thay đổi ở bước này:
  * `resources/js/pages/GuestOrderLookup.jsx`
  * `resources/js/pages/account/AccountOrderDetail.jsx`

## Cập nhật nhanh 2026-07-31 - dọn luồng bill và hóa đơn đỏ phía user

* Đã gỡ nút `Tải bill` khỏi màn `OrderSuccess` và `AccountOrderDetail` để bám đúng quyết định bỏ luồng người dùng tải bill.
* Đã gỡ nút tải PDF hóa đơn đỏ trong `VatInvoiceRequestModal`; màn người dùng hiện chỉ còn gửi và theo dõi yêu cầu hóa đơn đỏ.
* Đã đổi thông báo gửi yêu cầu hóa đơn đỏ ở frontend sang thông điệp nghiệp vụ mới:
  * `Hệ thống đã tiếp nhận yêu cầu xuất hóa đơn đỏ. Hóa đơn đỏ sẽ được gửi kèm cùng với sản phẩm. Nếu có thắc mắc hãy liên hệ quản trị viên.`
* Đã đổi text trạng thái modal hóa đơn đỏ sang bộ mới:
  * `pending`
  * `processing`
  * `fulfilled`
  * `rejected`
* Đã hiển thị thêm `admin_note` nếu có để người dùng biết ghi chú xử lý/từ chối.
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `resources/js/pages/OrderSuccess.jsx`
  * `resources/js/pages/account/AccountOrderDetail.jsx`
  * `resources/js/components/order/VatInvoiceRequestModal.jsx`

## Cập nhật nhanh 2026-07-31 - chỉnh hiển thị ghi chú hóa đơn đỏ

* Đã sửa modal hóa đơn đỏ để hiển thị đúng `note` người dùng đã nhập dưới nhãn `Ghi chú của bạn`.
* `admin_note` tiếp tục hiển thị riêng dưới nhãn `Ghi chú xử lý` nếu có.
* Đã đổi câu thông báo trong modal thành:
  * `Hệ thống đã tiếp nhận yêu cầu xuất hóa đơn đỏ. Bộ phận phụ trách sẽ xử lý và gửi hóa đơn cho bạn. Mọi thắc mắc vui lòng liên hệ quản trị viên hỗ trợ.`
* Chưa làm trong bước này:
  * hiển thị cờ/nhận biết đơn có yêu cầu hóa đơn đỏ ở màn admin quản lý đơn hàng
* File đã thay đổi ở bước này:
  * `resources/js/components/order/VatInvoiceRequestModal.jsx`

## Cập nhật nhanh 2026-07-31 - chỉ cho yêu cầu hóa đơn đỏ sau khi đã thanh toán

* Backend `VatInvoiceRequestService` hiện chặn cứng việc tạo yêu cầu hóa đơn đỏ nếu `order.payment_status !== paid`.
* Frontend `OrderSuccess` và `AccountOrderDetail` đã khóa thao tác `Yêu cầu hóa đơn đỏ` với đơn chưa thanh toán và hiện cảnh báo tiếng Việt rõ ràng.
* Đã dọn thêm các label user-facing ở khu vực tài khoản để không còn lộ enum kỹ thuật như:
  * `mock_bank`
  * `paid`
  * `shipped`
  * `mock`
  * `vnpay`
* Đã đồng bộ lại:
  * danh sách đơn hàng
  * lịch sử giao dịch
  * badge trạng thái đơn
  * fallback phương thức thanh toán ở màn chi tiết đơn
  * logic thanh toán lại trong `AccountOrderDetail` sang `mock_bank`
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `app/Services/VatInvoiceRequestService.php`
  * `resources/js/pages/OrderSuccess.jsx`
  * `resources/js/pages/account/AccountOrderDetail.jsx`
  * `resources/js/pages/account/AccountOrders.jsx`
  * `resources/js/pages/account/AccountTransactions.jsx`
  * `resources/js/components/orders/OrderStatusBadge.jsx`
  * `resources/js/components/orders/OrdersHeader.jsx`
  * `resources/js/components/orderDetail/OrderPaymentInfo.jsx`

## Cập nhật nhanh 2026-07-31 - hiển thị yêu cầu hóa đơn đỏ ở admin đơn hàng

* Backend admin order hiện đã trả thêm dữ liệu `vat_invoice_request` cho cả danh sách đơn và chi tiết đơn.
* Màn danh sách đơn admin đã hiện nhãn `Hóa đơn đỏ: ...` ngay dưới phần thanh toán nếu đơn có yêu cầu xuất hóa đơn đỏ.
* Popup chi tiết đơn admin đã có thêm khối `Yêu cầu hóa đơn đỏ` để xem nhanh:
  * trạng thái
  * tên đơn vị
  * mã số thuế
  * email nhận
  * ngày yêu cầu
  * nhân viên xử lý
  * thời điểm xử lý / hoàn tất
  * ghi chú xử lý
* Bước này chỉ bổ sung hiển thị nhận biết cho admin, chưa thêm bộ lọc riêng theo hóa đơn đỏ.
* `php -l app/Services/Admin/AdminOrderService.php` đã pass.
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `app/Services/Admin/AdminOrderService.php`
  * `resources/js/admin/mappers/adminOrderMapper.js`
  * `resources/js/admin/pages/AdminOrders.jsx`
  * `resources/js/admin/components/orders/AdminOrderDetailModal.jsx`

## Cập nhật nhanh 2026-07-31 - tách rõ trạng thái đơn, thanh toán và hóa đơn đỏ trong admin orders

* Đã bổ sung API admin riêng để cập nhật trạng thái hóa đơn đỏ:
  * `PATCH /api/admin/orders/{id}/vat-invoice-status`
* Luồng trạng thái hóa đơn đỏ admin hiện bám theo nghiệp vụ đã chốt:
  * `pending -> processing`
  * `processing -> fulfilled`
  * `pending -> rejected`
  * `processing -> rejected`
* Khi `rejected`, backend bắt buộc phải có `admin_note` để làm lý do từ chối.
* Chưa gọi email n8n tự động ở bước này; phần webhook/email sẽ cấu hình thủ công sau.
* Đã sửa bộ lọc admin đơn hàng để tách riêng:
  * `trạng thái đơn hàng`
  * `trạng thái thanh toán`
  * `trạng thái hóa đơn đỏ`
* Đã sửa cột danh sách admin:
  * cột `Thanh toán` chỉ còn trạng thái thanh toán + phương thức thanh toán
  * thêm cột riêng `Hóa đơn đỏ`
* Trong popup chi tiết đơn admin đã có thêm form riêng để xử lý hóa đơn đỏ, tách biệt khỏi form chuyển trạng thái đơn hàng.
* `php -l` đã pass cho:
  * `app/Http/Controllers/Api/Admin/AdminOrderController.php`
  * `app/Services/Admin/AdminOrderService.php`
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `routes/api.php`
  * `app/Http/Controllers/Api/Admin/AdminOrderController.php`
  * `app/Services/Admin/AdminOrderService.php`
  * `resources/js/admin/services/adminOrderService.js`
  * `resources/js/admin/mappers/adminOrderMapper.js`
  * `resources/js/admin/pages/AdminOrders.jsx`
  * `resources/js/admin/components/orders/AdminOrderDetailModal.jsx`

## Cập nhật nhanh 2026-07-31 - thêm quản lý Chính sách CRUD cho admin

* Đã bổ sung module admin riêng cho `Chính sách`, không dùng chung với `Nội dung site`.
* Backend admin policy hiện có các API:
  * `GET /api/admin/policies`
  * `POST /api/admin/policies`
  * `GET /api/admin/policies/{id}`
  * `PUT /api/admin/policies/{id}`
  * `PATCH /api/admin/policies/{id}/toggle-active`
  * `DELETE /api/admin/policies/{id}`
* Đã thêm service backend `AdminPolicyService` để xử lý:
  * lọc danh sách theo từ khóa / loại / trạng thái hiển thị
  * tạo slug tự động nếu để trống
  * cập nhật / xóa mềm / bật tắt hiển thị
* Frontend admin đã có màn `/admin/policies` với các chức năng:
  * xem danh sách
  * lọc
  * thêm mới
  * xem chi tiết
  * chỉnh sửa
  * bật/tắt hiển thị
  * xóa mềm
* Đã thêm menu admin `Chính sách` ở sidebar và topbar breadcrumb/title.
* Không chạy migration trong bước này vì bảng `policies` đã có sẵn.
* `php -l` đã pass cho:
  * `app/Services/Admin/AdminPolicyService.php`
  * `app/Http/Controllers/Api/Admin/AdminPolicyController.php`
* Build frontend production bằng Vite đã pass.
* File đã thay đổi ở bước này:
  * `routes/api.php`
  * `app/Services/Admin/AdminPolicyService.php`
  * `app/Http/Controllers/Api/Admin/AdminPolicyController.php`
  * `resources/js/app.jsx`
  * `resources/js/admin/layout/AdminSidebar.jsx`
  * `resources/js/admin/layout/AdminTopbar.jsx`
  * `resources/js/admin/mappers/adminPolicyMapper.js`
  * `resources/js/admin/services/adminPolicyService.js`
  * `resources/js/admin/pages/AdminPolicies.jsx`

## Cập nhật nhanh 2026-07-31 - tối ưu thứ tự hiển thị ở admin Chính sách

* Màn `AdminPolicies` hiện mặc định lọc theo `Thứ tự tăng dần` thay vì `Mới nhất`.
* Khi bấm `Thêm chính sách`, form sẽ điền sẵn `thứ tự` kế tiếp hiện tại từ backend.
* Sau khi tạo/chỉnh sửa chính sách, danh sách sẽ tải lại theo `thứ tự` tăng dần và quay về trang 1 để admin kiểm tra nhanh.
* Cột `Thứ tự` đã được chuyển ra ngoài cùng bên trái để dễ nhìn khi quản lý danh sách.
* Backend `AdminPolicyService` hiện trả thêm `next_sort_order` trong response danh sách để frontend không phải tự suy đoán.
* File đã thay đổi ở bước này:
  * `app/Services/Admin/AdminPolicyService.php`
  * `resources/js/admin/mappers/adminPolicyMapper.js`
  * `resources/js/admin/pages/AdminPolicies.jsx`

## Cập nhật nhanh 2026-07-31 - ẩn FAQ và Giới thiệu khỏi menu người dùng

* Frontend user hiện đã lọc chặt hơn các mục `FAQ` và `Giới thiệu` trong `Navbar`, kể cả khi menu đang lấy dữ liệu động từ `siteContent`.
* Bộ lọc mới không chỉ chặn theo URL `/faq`, `/faqs`, `/about` mà còn chặn theo nhãn hiển thị `FAQ`, `Giới thiệu`, `gioi thieu` để tránh hiện lại do dữ liệu cũ.
* Không xóa backend, model, service hay dữ liệu của `FAQ` và `Giới thiệu` trong bước này.
* File đã thay đổi ở bước này:
  * `resources/js/components/layout/Navbar.jsx`

## Cập nhật nhanh 2026-07-31 - bỏ FAQ và Giới thiệu khỏi dữ liệu seed menu

* `SiteContentSeeder` không còn seed các mục `FAQ` và `Giới thiệu` ở:
  * menu desktop
  * menu mobile
* Hero trang chủ cũng không còn seed nút `Tìm hiểu thêm` trỏ tới `/about`.
* Seeder hiện chủ động xóa các item cũ sau khỏi `site_component_items` khi chạy lại:
  * `desktop_faq`
  * `desktop_about`
  * `mobile_faq`
  * `mobile_about`
  * `hero_button_about`
* Bước này chỉ thay đổi dữ liệu seed, không thay đổi migration hay schema database.
* File đã thay đổi ở bước này:
  * `database/seeders/SiteContentSeeder.php`

## Cập nhật nhanh 2026-07-31 - bỏ lượt xem khỏi Blog phía người dùng

* Backend `BlogService` không còn `increment view_count` khi người dùng mở chi tiết bài viết.
* Response blog public không còn phụ thuộc vào `view_count` trong list/detail formatter.
* Giao diện user đã bỏ toàn bộ hiển thị `lượt xem` ở:
  * card bài viết nổi bật
  * card bài viết sidebar
  * hero chi tiết blog
  * khối thông tin bài viết
* Sidebar blog hiện lấy danh sách bài viết gợi ý từ bài nổi bật + bài đang hiển thị, không còn sắp theo lượt xem.
* Bước này chưa làm CRUD admin Blog, sẽ là bước tiếp theo.
* File đã thay đổi ở bước này:
  * `app/Services/BlogService.php`
  * `resources/js/services/mappers/blogMapper.js`
  * `resources/js/pages/Blog.jsx`
  * `resources/js/components/blog/BlogPostCard.jsx`
  * `resources/js/components/blogDetail/BlogDetailHero.jsx`
  * `resources/js/pages/BlogDetail.jsx`

## Cập nhật nhanh 2026-07-31 - bỏ thời gian đọc và đưa lượt xem blog seed về 0

* Giao diện chi tiết Blog phía người dùng không còn hiển thị `thời gian đọc` ở:
  * hero bài viết
  * khối `Thông tin bài viết`
* `BlogSeeder` hiện seed toàn bộ `view_count = 0` để dữ liệu demo khớp yêu cầu đã chốt.
* Khi cần áp dụng dữ liệu mới, chỉ cần chạy lại seeder Blog hoặc toàn bộ seeder thủ công; không cần migration cho bước này.
* File đã thay đổi ở bước này:
  * `resources/js/components/blogDetail/BlogDetailHero.jsx`
  * `resources/js/pages/BlogDetail.jsx`
  * `database/seeders/BlogSeeder.php`

## Cập nhật nhanh 2026-07-09 - tài liệu tổng hợp hệ thống hiện tại

* Đã tạo `docs/current-system-summary.md` để tổng hợp chức năng hiện có của CTUT UniShop phục vụ báo cáo NCKH.
* Tài liệu gồm: tổng quan hệ thống, chức năng người dùng, chức năng admin, chatbot AI, n8n automation, bảo vệ/rate limit, triển khai Docker, điểm nổi bật, danh sách màn hình nên chụp và bảng dữ liệu quan trọng.
* Không sửa code, không sửa `.env`, không đưa secret/token/API key vào tài liệu.

## Cập nhật nhanh 2026-07-09 - rate limit và chống spam cơ bản

* Sửa bổ sung: `Handler` phải trả nguyên `HttpResponseException` từ Laravel throttle, nếu không custom `RateLimiter::response()` sẽ bị nhánh API chung ép thành HTTP 400 thay vì 429.
* Axios client có fallback riêng cho HTTP 429 theo route login/contact/checkout/chatbot để toast không rơi về message chung khi backend/proxy thiếu message.
* Đã thêm các RateLimiter Laravel: `api`, `auth`, `contact`, `checkout`, `chatbot`, `admin`, `upload`, `webhook`.
* Đã gắn throttle vào route nhạy cảm: auth, contact submit, checkout/pay, chat send/reset/translate, admin group, admin upload, AI knowledge upload và webhook n8n/notification với ngưỡng cao.
* Đã thêm middleware `BlockRateLimitedIp` để chặn mềm IP 10 phút nếu vượt giới hạn quá nhiều lần trong thời gian ngắn.
* HTTP 429 trả JSON tiếng Việt theo format `success`, `message`, `errors`, `data`; frontend hiện dùng interceptor lấy `message` nên các toast/form sẽ nhận message tiếng Việt.
* Đã chạy `php -l` cho các file PHP đã sửa, `php artisan route:list` bằng PHP Laragon và build production bằng Vite/Node bundled. `npm run build` vẫn không chạy do máy chưa có `npm` trong PATH.

## Cập nhật nhanh 2026-07-09 - catalog error toast

* Đã sửa lỗi frontend admin `/admin/catalogs` không hiển thị toast khi backend chặn xóa danh mục/khoa do còn liên kết.
* `ConfirmDialog` hiện catch lỗi async từ `onConfirm`, hiển thị message API và luôn tắt loading, tránh `Uncaught in promise`.
* Bật/tắt danh mục và đơn vị/khoa trên `AdminCatalogManagement` cũng đã có `try/catch` để toast lỗi tiếng Việt.
* Build frontend production bằng Vite/Node bundled đã pass.

## Cập nhật nhanh 2026-07-09 - admin contacts/catalogs

* Đã thêm màn admin `/admin/contacts` để quản lý liên hệ từ form public: lọc, thống kê, xem chi tiết, cập nhật trạng thái, ghi chú nội bộ và xóa mềm.
* Đã thêm màn admin `/admin/catalogs` gồm 2 tab: danh mục sản phẩm và đơn vị/khoa; hỗ trợ thêm/sửa/bật tắt/xóa có kiểm tra liên kết sản phẩm/danh mục con.
* Đã thêm API admin cho `contacts`, `categories`, `departments` và endpoint `active-options` để form sản phẩm dùng danh mục/khoa đang bật.
* Có migration mới `2026_07_09_000001_extend_admin_contact_catalog_tables.php`; đã chạy `php artisan migrate` thành công trên DB hiện tại.
* `php -l` đã pass cho controller/service/model/migration/routes liên quan.
* Build frontend production đã pass bằng Node bundled gọi Vite trực tiếp; lệnh `npm run build` không chạy được trong PowerShell vì máy hiện không có `npm` trong PATH.

## Cập nhật nhanh 2026-07-09 - order_email user_id

* Đã bổ sung `data.user_id` vào payload `order_email` gửi sang n8n trong `OrderEmailWebhookService`.
* `user_id` lấy từ `order.user_id`, fallback `order.user.id` nếu cần; guest order gửi `user_id=null`, không tự đoán user theo email.
* COD và payment success giả lập ngân hàng đều dùng payload chung này nên node n8n IF Has User có thể kiểm tra `$json.data.user_id`.

## Cập nhật nhanh 2026-07-09 - n8n order webhook

* Đã gỡ listener `SendOrderCreatedWebhook` khỏi `OrderCreated` trong `EventServiceProvider` để không còn gửi `event=order_created` vào webhook n8n dùng cho mail đơn hàng.
* COD và thanh toán giả lập ngân hàng thành công hiện chỉ dùng `event=order_email`; payload email vẫn giữ các field `recipient_email`, `customer_email`, `user_email`, `guest_email`, `payment_method`, `payment_status`, `order_status`, `is_cod`, `is_paid`, `items`.
* `contact_submitted` giữ nguyên, không sửa webhook/token/secret/n8n workflow.
* Notification nội bộ cho user đăng nhập vẫn được tạo trực tiếp trong Laravel, không phụ thuộc listener `order_created` gửi n8n.

## Cập nhật nhanh 2026-07-09

* Đã thêm `OrderEmailWebhookService` để gửi webhook n8n `event=order_email` dùng chung cho COD và payment success.
* Payload email đơn hàng hiện có danh sách `items`, thông tin `payment_status`, `order_status`, `is_cod`, `is_paid`, `email_type`.
* COD gửi webhook sau checkout thành công với `email_type=cod_order_created`; payment success gửi qua listener `UpdateStockAfterPayment` với `email_type=payment_success`.

* Đã bổ sung payload webhook n8n cho `order_paid`: có `customer_email`, `user_email`, `guest_email`, `recipient_email`, `payment_method`, `paid_at`, `action_url`.
* Đã bổ sung `type=contact_submitted` vào payload liên hệ gửi sang n8n, giữ nguyên các field contact cũ.

* Đã chuẩn hóa parser chatbot bằng `normalizeVietnameseText()` để câu có dấu/không dấu đi cùng intent.
* Thêm intent `off_topic` cho nhóm ngoài phạm vi như phở, cơm, bún, mì, trà sữa, cà phê, nước mía, bánh mì, đồ ăn; các câu này trả guard, không gọi database/vector store.
* Debug chatbot hiện có thêm `original_message` và `normalized_message`.
* Đã bổ sung test case 58-67 cho nhóm tiếng Việt có dấu/không dấu.

* Đã sửa lỗi phân loại intent chatbot sau giai đoạn 2: thêm `small_talk`, ưu tiên `static_knowledge` trước `product_search`, không còn dùng `product_query` chung chung để search sản phẩm.
* Các câu chào/cảm ơn như “xin chao”, “thanks”, “ok” trả lời trực tiếp, không gọi database/vector store.
* Các câu chính sách/hướng dẫn/thanh toán/giao hàng/liên hệ đi qua `OpenAiStaticKnowledgeService` với prompt platform + vector store.
* Câu hỏi giá/tồn kho sản phẩm nếu exact lookup thất bại sẽ fallback `search_products`; 1 sản phẩm thì lấy giá/tồn kho, nhiều sản phẩm thì hỏi lại người dùng.

* Giai đoạn 2 chatbot: đã thêm `OpenAiStaticKnowledgeService` để gọi OpenAI Responses API bằng Prompt ID/Version trên platform.openai.com và `file_search`.
* Cấu hình mới trong `config/services.php`: `OPENAI_STATIC_PROMPT_ID`, `OPENAI_STATIC_PROMPT_VERSION`, `OPENAI_STATIC_KNOWLEDGE_MAX_RESULTS`.
* `.env.production.example` đã có các biến static prompt, `OPENAI_STATIC_PROMPT_ID` để rỗng cho production tự cấu hình.
* `OpenAiHybridRagChatService` vẫn giữ dữ liệu động qua database; chỉ intent `static_knowledge`/`rag` mới gọi vector store.
* Nếu thiếu vector store sẽ báo lỗi tiếng Việt; nếu không có source/file_search result thì trả fallback an toàn của CTUT UniShop.
* Đã bổ sung test case 41-47 trong `docs/chatbot-test-cases.md` cho nhóm tài liệu tĩnh.

* Đã chỉnh hệ thống chatbot theo hướng tách dữ liệu động và dữ liệu tĩnh.
* Dữ liệu động về sản phẩm, giá, tồn kho, biến thể, khuyến mãi và đơn hàng được ưu tiên xử lý bằng database/service Laravel, không để RAG tự suy đoán.
* `OpenAiHybridRagChatService` đã có parser `extractEntities()` để nhận diện intent, product/category/department, size, color, khoảng giá và confidence.
* Thêm intent/luồng `clarify` cho câu hỏi mơ hồ như “có không?”, “bao nhiêu?”, “còn không?”, “có bán phổ không?”.
* `ChatbotProductCatalogService` đã lọc sản phẩm đang bật bán, chỉ load variant đang mở bán, hỗ trợ tìm theo category, department, size, color và tồn kho.
* RAG/file_search chỉ dùng cho tài liệu tĩnh như chính sách, FAQ, hướng dẫn; nếu không có source thì trả thông báo chưa tìm thấy trong tài liệu hỗ trợ.
* Đã tạo `docs/chatbot-test-cases.md` với 40 câu hỏi kiểm thử thủ công.
* Đã chạy `php -l` cho 3 service chatbot đã sửa, không có lỗi cú pháp.

## Cập nhật nhanh 2026-07-04

* Đã vá luồng `mock payment callback` cho trang user theo hướng sửa tối thiểu.
* `PaymentController::callback()` không còn redirect bằng `FRONTEND_URL` tuyệt đối trong luồng hiện tại, mà trả về `/order-success` cùng origin để tránh lệch `localhost` và `127.0.0.1` làm mất trạng thái `localStorage/sessionStorage`.
* Callback hiện truyền thêm `order_id` trên query string để frontend có thể tải đúng đơn hàng của user đã đăng nhập.
* `resources/js/pages/OrderSuccess.jsx` đã ưu tiên `orderService.getOrderDetail(orderId)` khi có user đăng nhập; chỉ fallback sang `guestOrderService.getByCode()` cho nhánh guest.
* Cần test lại 3 luồng sau: user đăng nhập + mock payment, guest + mock payment, và callback online payment khác nếu còn dùng redirect về `order-success`.

## Cập nhật nhanh 2026-07-01

* Đang tối ưu hiệu năng shop/home theo hướng giảm overfetch.
* Đã thêm `Product::thumbnailImage()` và `Product::primaryImage()` để lấy ảnh đại diện gọn hơn.
* Đã thêm `ProductService::formatProductSummary()` cho shop grid, home blocks, recently viewed và related products.
* `ProductService::formatProduct()` vẫn giữ cho trang chi tiết/chatbot/khuyến mãi và tiếp tục load `images` khi cần dữ liệu đầy đủ.
* Quyết định: danh sách sản phẩm chỉ lấy dữ liệu card cần dùng, không eager load toàn bộ `images`, `category.parent`, `description` nếu frontend không dùng.
* TODO tiếp: sau khi test `/api/products` và `/api/home`, tiếp tục rà API nặng ở admin orders, analytics và chatbot.

# CTUT UniShop (NCKH) - Handoff cho Codex/ChatGPT

Version: 1.1

Last Updated: 2026-07-01 (cập nhật sau khi bổ sung order status history cho checkout/user cancel/payment callback và chỉnh timeline order)

---

## 1. Mục đích

File này là nguồn thông tin bàn giao chính để bất kỳ Codex hoặc tài khoản ChatGPT nào khác mở repository cũng có thể:

* hiểu nhanh trạng thái hiện tại của dự án
* biết phần nào đã xong
* biết phần nào đang làm dở
* biết TODO tiếp theo
* biết các quyết định kiến trúc đã thống nhất
* biết bug/rủi ro còn tồn tại
* biết các điều tuyệt đối không được thay đổi

Khi có thay đổi liên quan đến tiến độ, kiến trúc, bug, TODO hoặc nguyên tắc bất biến, phải cập nhật file này.

---

## 2. Quy tắc bàn giao

Trước khi làm việc:

1. Đọc `AGENTS.md`
2. Đọc `CODEX_HANDOFF.md`
3. Kiểm tra `git status`
4. Đọc source code thật trước khi kết luận

Khi kết thúc một đợt sửa đáng kể:

1. cập nhật mục `Đã hoàn thành`
2. cập nhật mục `Đang thực hiện`
3. cập nhật mục `TODO tiếp theo`
4. cập nhật mục `Bug/Rủi ro còn tồn tại` nếu phát sinh
5. cập nhật mục `Quyết định kiến trúc đã thống nhất` nếu có thay đổi

---

## 3. Tổng quan dự án

### Tech stack

Backend:

* Laravel 10
* PHP 8.4 hiện đang được dùng ở máy local
* Laravel Sanctum
* Eloquent ORM

Frontend:

* React 18
* Vite
* Tailwind CSS
* Axios

Hạ tầng và dịch vụ:

* MySQL
* Docker / n8n
* OpenAI API
* VNPay
* Mock payment
* Pusher/Echo cho realtime ở một số phần

### Branch làm việc

* Branch chính đang dùng: `mong`
* Không tự ý checkout sang branch khác

---

## 4. Đã hoàn thành

Lưu ý: danh sách này là theo những phần đã được triển khai/xác nhận trong cuộc hội thoại hiện tại, không phải audit tuyệt đối 100% toàn bộ lịch sử git.

### 4.1 Mua hàng / checkout / payment

Đã làm:

* Nới validate địa chỉ: chỉ bắt buộc tên và số điện thoại, các trường địa chỉ khác có thể null theo yêu cầu người dùng.
* Luồng thanh toán online đã có bước QR giả lập riêng thay vì nhảy thẳng sang trang kết quả.
* Có nút hoàn tất thanh toán ở trang QR để đi tiếp sang kết quả đơn hàng.
* Đã xử lý nhiều lỗi guest/user ở luồng order success, notification và guest order.
* Đã có bill PDF đơn hàng.
* Đã có hóa đơn đỏ PDF giả lập theo hướng mock provider / sandbox style.
* Checkout tạo luôn `payment pending` theo `payment_method` đã chọn.
* `PaymentService::pay()` chặn đổi phương thức thanh toán giữa chừng nếu đơn đã tạo với phương thức khác.
* Đã đồng bộ rule trạng thái admin từ backend sang frontend admin.
* Đã đồng bộ các cờ thao tác order phía user từ backend sang frontend:
  * `can_cancel`
  * `can_pay_again`
  * `can_review_order`
  * `can_review` theo từng item
* Đã bổ sung `payment.created_at` và `payment.updated_at` cho order detail phía user.
* Đã nâng cấp timeline order bước đầu để phản ánh tốt hơn các nhánh:
  * created
  * payment
  * processing
  * shipped
  * completed
  * cancelled / expired
* Đã bổ sung ghi `order_status_histories` cho các luồng thực tế:
  * checkout tạo đơn `pending`
  * user hủy đơn
  * payment callback success / failed / timeout cho `mock` và `vnpay`
  * pay endpoint phát hiện đơn hết hạn
* Đã chỉnh timeline user order để:
  * không còn coi `paid` là `processing`
  * ưu tiên lấy mốc thời gian từ `order_status_histories`
  * fallback về `payment.updated_at` / `order.updated_at` khi cần

### 4.2 Social automation / n8n / Facebook

Đã làm:

* Đăng sản phẩm lên Facebook qua n8n.
* Đăng khuyến mãi lên Facebook qua n8n.
* Đã xử lý lỗi URL không hợp lệ khi dùng URL local (`localhost`) cho Facebook.
* Đã chốt hướng phải dùng URL public/absolute cho link bài đăng và ảnh.
* Đã hỗ trợ nội dung social có AI/caption workflow và callback về Laravel.

### 4.3 Admin analytics

Đã làm:

* Nâng cấp dashboard thống kê admin.
* Có hệ log hành vi người dùng và funnel cơ bản.
* Có các chỉ số visitor / page view / product view / add to cart / checkout / purchase / conversion / repeat / bounce.
* Có biểu đồ doanh thu, đơn hàng, funnel, top sản phẩm, doanh thu theo danh mục, trạng thái đơn hàng.
* Có filter tổng cho toàn trang và filter riêng cho doanh thu theo giai đoạn đã chốt.
* Có realtime cập nhật số liệu theo hướng broadcast dữ liệu tổng hợp.
* Đã tối ưu bước đầu `overview()` để gom nhiều phép đếm/tổng về ít query tổng hợp hơn.

### 4.4 Chatbot / AI knowledge

Đã làm:

* Đã sửa lỗi `JsonResponse status must be int`.
* Đã tối ưu bước đầu để chatbot không nhả nguyên file ra UI như trước.
* Đã thêm hệ conversation/message/summary cho chatbot theo hướng lưu DB.
* Đã hỗ trợ user và guest bằng token.
* Đã có trang admin xem hội thoại AI.
* Đã xử lý một số lỗi hiển thị hội thoại admin và lỗi font ở admin.
* Đã cải thiện trả lời tiếng Anh và hướng dịch sang tiếng Việt ở mức bước đầu.

### 4.5 Dọn campaign

Đã làm:

* Một phần nội dung liên quan `campaign/chiến dịch` đã được thay/xóa theo yêu cầu người dùng, ưu tiên dùng `khuyến mãi`.

### 4.6 Tối ưu API / clamp phân trang

Đã làm:

* Đã clamp `per_page` ở nhiều service để tránh request frontend làm nặng hệ thống quá mức.
* Đã bắt đầu tối ưu hiệu năng home:
  * cache 4 block sản phẩm ngoài home cho guest trong 5 phút
  * relation variants ở home chỉ lấy bản ghi active

### 4.7 Hạ tầng bàn giao

Đã làm:

* Đã có `AGENTS.md`.
* Đã có `CODEX_HANDOFF.md` này để dùng làm nguồn bàn giao chính.

---

## 5. Đang thực hiện

### Module hiện tại: Order / Payment / User order actions

Đang làm dở:

1. Siết chặt tính nhất quán giữa `order status` và `payment status`
2. Giảm lệch logic giữa user UI và admin UI
3. Rà lại edge case còn lại sau khi timeline đã bám `order_status_histories`
4. Tiếp tục phase hiệu năng ở home/shop/admin

### Những thay đổi đang có trong working tree nhưng chưa commit tại thời điểm cập nhật file này

Các file đang thay đổi:

* `AGENTS.md`
* `app/Services/OrderService.php`
* `app/Services/PaymentService.php`
* `app/Services/OrderQueryService.php`
* `app/Services/Gateways/MockPaymentGatewayService.php`
* `app/Services/Gateways/VNPayService.php`
* `app/Services/Admin/AdminOrderService.php`
* `resources/js/admin/components/orders/AdminOrderDetailModal.jsx`
* `resources/js/admin/mappers/adminOrderMapper.js`
* `resources/js/services/mappers/orderMapper.js`
* `resources/js/pages/account/AccountOrders.jsx`
* `resources/js/pages/account/AccountOrderDetail.jsx`

Ý nghĩa:

* `checkout` hiện tạo luôn một payment `pending` theo `payment_method` đã chọn.
* `PaymentService::pay()` hiện chặn việc đổi phương thức thanh toán khác với phương thức đã tạo đơn.
* Admin order detail hiện đang được đồng bộ để lấy danh sách trạng thái kế tiếp từ backend thay vì hardcode sai ở frontend.
* User order list/detail hiện dùng cờ thao tác từ backend thay vì tự suy luận ở frontend.
* Order detail hiện đã có helper timeline riêng ở backend, không còn hardcode timeline đơn giản như trước.
* Các luồng checkout / user cancel / payment callback bây giờ đã ghi `order_status_histories`, không còn phụ thuộc gần như hoàn toàn vào `updated_at`.
* Home guest hiện đã có cache riêng cho các block sản phẩm nổi bật/mới/bán chạy/đánh giá cao.
* Admin analytics overview hiện đã giảm số query đếm/tổng rời rạc.

Lưu ý:

* Các thay đổi này cần được giữ khi Codex khác tiếp tục làm.
* Trước khi sửa tiếp phải đọc lại diff hiện tại.

---

## 6. TODO tiếp theo

### Ưu tiên cao - làm tiếp ngay sau khi đọc file này

#### TODO 1. Tiếp tục siết logic trạng thái order/payment

Cần rà tiếp:

* điều kiện cancel ở user có cần phân nhánh thêm cho online unpaid / COD
* điều kiện pay lại có cần cho phép reuse pending transaction trong một số case UI cụ thể
* điều kiện completed / review / notification có còn điểm lệch nào không

#### TODO 2. Rà lại edge case timeline/order state sau khi đã gắn `order_status_histories`

Cần kiểm tra thêm:

* có cần tách riêng timeline COD và timeline online không
* có cần thêm trạng thái thất bại thanh toán hiển thị rõ hơn ở UI không
* có cần hiển thị `paid` như một trạng thái trung gian rõ hơn trong UI user không

#### TODO 3. Tiếp tục tối ưu hiệu năng tải trang

Sau khi module order/payment ổn:

* rà eager loading
* rà query nặng ở trang home/shop/admin analytics/admin orders
* rà ảnh / thumbnail / API overfetch
* cân nhắc tách formatter list/detail cho product nếu thấy `formatProduct()` đang tính quá nặng ở grid

---

## 7. Quyết định kiến trúc đã thống nhất

### 7.1 Luồng debug

Khi sửa bug phải đọc theo thứ tự:

Route -> Middleware -> Controller -> FormRequest -> Service -> Model -> Migration -> Frontend service -> React component -> Log -> Browser console

### 7.2 Không nhồi business logic vào controller

* Controller chỉ nhận request / validate / authorize / gọi service / trả response
* Business logic nằm ở Service

### 7.3 Không tự ý đổi contract API

Không tự ý đổi:

* key response
* HTTP status
* JSON shape

Trừ khi đã kiểm tra toàn bộ frontend liên quan.

### 7.4 Payment method phải nhất quán từ lúc checkout

Đây là quyết định mới đã thống nhất trong source đang sửa:

* Khi checkout phải tạo payment `pending` ngay theo `payment_method`
* Không cho đổi phương thức thanh toán giữa chừng nếu đã có pending payment cho đơn

Lý do:

* tránh lệch logic `order` và `payment`
* tránh UI “thanh toán lại” bị suy luận sai
* tránh order online bị trả theo flow COD hoặc ngược lại

### 7.5 Order timeline ưu tiên dữ liệu lịch sử thật

Quyết định mới:

* timeline order phía user phải ưu tiên lấy mốc từ `order_status_histories`
* chỉ fallback sang `payment.updated_at` hoặc `order.updated_at` nếu chưa có history phù hợp
* trạng thái `paid` của đơn online không được xem đồng nghĩa với bước `processing`

### 7.6 Admin UI không được tự suy ra rule trạng thái nếu backend đã có rule thật

Frontend admin phải lấy rule trạng thái từ backend hoặc dùng logic giống hệt backend, không hardcode lệch.

### 7.7 User order UI cũng không được tự suy ra action nếu backend đã có rule thật

Frontend user phải ưu tiên dùng cờ thao tác từ backend cho:

* hủy đơn
* thanh toán lại
* đánh giá

### 7.8 Chatbot phải tối ưu token và context

Định hướng đã thống nhất:

* không gửi toàn bộ lịch sử chat lên AI
* ưu tiên summary + recent messages + dữ liệu intent liên quan
* user và guest đều có session riêng

### 7.9 Social automation dùng URL public

Các link gửi sang Facebook / dịch vụ ngoài phải là URL public, không dùng `localhost`.

---

## 8. Bug / rủi ro còn tồn tại

### 8.1 Timeline order chưa đủ chuẩn nghiệp vụ

Timeline hiện chưa thể hiện đầy đủ tất cả nhánh:

* đơn hết hạn
* đơn bị hủy
* đơn COD
* đơn online thanh toán thất bại rồi retry

### 8.2 Một số đơn cũ có thể chưa có đủ history

Các đơn được tạo trước khi vá logic mới có thể thiếu bản ghi `order_status_histories` ở một số bước.

Rủi ro:

* timeline của đơn cũ vẫn phải fallback về `updated_at`
* admin/user có thể thấy timeline giữa đơn cũ và đơn mới chưa đồng đều

### 8.3 Encoding tiếng Việt cũ ở nhiều file

Nhiều file cũ đang có chuỗi tiếng Việt lỗi mã hóa khi xem qua terminal PowerShell.

Lưu ý:

* không refactor hàng loạt chỉ để sửa encoding nếu người dùng chưa yêu cầu
* nếu chạm vào file, phải tránh làm hỏng thêm nội dung

### 8.4 Hiệu năng tổng thể vẫn còn cần tối ưu

Người dùng phản hồi web load lâu.

Rủi ro chính:

* eager load chưa tối ưu
* query admin nặng
* analytics nặng
* ảnh chưa tối ưu
* frontend gọi API dư / mapper xử lý lặp

### 8.5 Working tree đang bẩn

Ngoài các file đang sửa hợp lệ, còn có untracked:

* `PHP version/`
* `README copy.md`

Không tự xóa, không tự commit nếu người dùng chưa yêu cầu.

---

## 9. Những điều tuyệt đối không được thay đổi

### 9.1 Git / branch

* Không checkout branch khác
* Không commit / push nếu user chưa yêu cầu
* Không reset / rebase / clean nếu user chưa yêu cầu

### 9.2 API / hợp đồng dữ liệu

Không tự ý đổi:

* route
* response key
* status code
* cấu trúc JSON

### 9.3 Payment / n8n / AI

Không tự ý đổi:

* webhook
* callback
* secret
* luồng OpenAI / vector store / n8n nếu user chưa yêu cầu

### 9.4 UI

Không tự redesign UI nếu user chưa yêu cầu.

### 9.5 Migration / DB destructive

Không tự chạy:

* `php artisan migrate`
* `php artisan migrate:fresh`
* `php artisan db:seed`

Không tự sửa DB theo kiểu phá vỡ dữ liệu hiện có nếu chưa được user đồng ý.

---

## 10. File / module cần đọc khi tiếp tục công việc hiện tại

Nếu tiếp tục module order/payment đang dở, ưu tiên đọc:

### Backend

* `routes/api.php`
* `app/Http/Controllers/Api/OrderController.php`
* `app/Http/Controllers/Api/PaymentController.php`
* `app/Http/Controllers/Api/Admin/AdminOrderController.php`
* `app/Services/OrderService.php`
* `app/Services/PaymentService.php`
* `app/Services/OrderQueryService.php`
* `app/Services/Admin/AdminOrderService.php`
* `app/Services/Gateways/MockPaymentGatewayService.php`
* `app/Services/Gateways/VNPayService.php`
* `app/Models/Order.php`
* `app/Models/Payment.php`
* `app/Models/OrderStatusHistory.php`

### Frontend user

* `resources/js/services/orderService.js`
* `resources/js/services/paymentService.js`
* `resources/js/services/mappers/orderMapper.js`
* `resources/js/pages/account/AccountOrders.jsx`
* `resources/js/pages/account/AccountOrderDetail.jsx`
* `resources/js/pages/Checkout.jsx`

### Frontend admin

* `resources/js/admin/services/adminOrderService.js`
* `resources/js/admin/mappers/adminOrderMapper.js`
* `resources/js/admin/pages/AdminOrders.jsx`
* `resources/js/admin/components/orders/AdminOrderDetailModal.jsx`

---

## 11. Cách cập nhật file này trong các lần tiếp theo

Mỗi khi hoàn thành một đợt sửa, cần cập nhật tối thiểu:

1. `Last Updated`
2. `Đã hoàn thành`
3. `Đang thực hiện`
4. `TODO tiếp theo`
5. `Bug / rủi ro còn tồn tại`

Nếu có quyết định kiến trúc mới, cập nhật thêm:

* `Quyết định kiến trúc đã thống nhất`

Nếu có điều cấm thay đổi mới, cập nhật thêm:

* `Những điều tuyệt đối không được thay đổi`
## Cập nhật nhanh 2026-07-06

* Đã đồng bộ lại logic seed data cho `orders`, `payments`, `promotion_items` và `inventory_histories` theo flow runtime hiện tại.
* `OrderSeeder` không còn cộng `sold_stock` cho đơn `paid/processing/shipped`; các trạng thái này giờ giữ ở `reserved_stock`, chỉ `completed` mới chuyển sang `sold_stock`.
* `PaymentSeeder` đã có nhánh `cod` cho đơn `pending` để demo đúng rule chuyển trạng thái admin theo `payment method`.
* `PromotionItemSeeder` đã chặn `limit_quantity` không vượt quá tồn kho sản phẩm/biến thể.
* `InventoryHistorySeeder` giờ mô phỏng đúng 3 bước `checkout_reserve`, `order_completed`, `order_release` thay vì ghi lịch sử không khớp flow thật.
* `SystemSettingSeeder` đã được sửa để chỉ seed một bản ghi cấu hình thống nhất, tránh lệch khi runtime đọc `first()` hoặc `value()`.
* `NotificationSeeder` đã được sửa để notification `order/payment` chỉ bám theo đơn hàng thực có của từng user, tránh tạo dữ liệu demo sai nghiệp vụ.
* Nhóm seed content `Blog/Faq/Policy/Contact/ProductImage` đã chuyển sang `updateOrCreate()` để tránh nhân bản dữ liệu khi chạy lại.
* `AboutSeeder` đã đưa các chỉ số thống kê mẫu về `0` để tránh hiểu nhầm là số liệu thực tế của Trường.
* Các seeder `Address/Cart/CartItem/RecentlyViewed/SearchHistory/Review/ReviewImage/Promotion/Notification/Payment/PromotionItem/OrderStatusHistory` đã được chuyển sang hướng idempotent để hạn chế trùng dữ liệu khi chạy lại.
* `ProductVariantSeeder` đã dùng `updateOrCreate()` theo `sku`; `OrderSeeder` dùng `firstOrCreate()` theo `order_code` để tránh tạo lặp biến thể/đơn hàng.
* `InventoryHistorySeeder` cũng đã chuyển sang `updateOrCreate()` theo `product_variant_id + type + order_id` cho bộ seed mẫu hiện tại.

## Cập nhật nhanh 2026-07-09

* Đã sửa luồng admin bật/tắt sản phẩm để frontend gửi `is_active` và backend vẫn chấp nhận `is_active`, `isActive`, `active`.
* Backend admin product đã trả message tiếng Việt cho lỗi thiếu/sai trạng thái mở bán, mở variant khi product đang tắt, tạo caption và đăng Facebook.
* Đã chặn đăng Facebook sản phẩm khi sản phẩm đang tắt bán hoặc không có biến thể đang mở bán.
* Đã chặn tạo caption/đăng Facebook khuyến mãi khi khuyến mãi đang tắt, nháp, chưa hoạt động, đã kết thúc, không có item active hoặc không có sản phẩm/variant còn mở bán.
* Frontend admin product/promotion đã chặn sớm thao tác đăng Facebook không hợp lệ và hiển thị toast tiếng Việt rõ ràng.
* API client đã ưu tiên `response.data.message`, sau đó lỗi đầu tiên trong `errors`, rồi mới fallback tiếng Việt.
* PHP lint đã pass cho các file backend liên quan. Build frontend không hoàn tất vì môi trường hiện tại thiếu `npm` trong PATH và khi gọi trực tiếp Vite bằng Node bundled thì bị `EPERM` khi ghi `public/build/assets`.

## Cập nhật nhanh 2026-07-09 - Admin user detail

* Đã sửa `AdminUserService::show()` không còn select sai các cột `name`, `address` từ bảng `addresses`.
* Detail user admin hiện eager load địa chỉ bằng các field đúng: `full_name`, `phone`, `province`, `district`, `ward`, `address_line`, `postal_code`, `is_default`.
* Output `addresses` vẫn giữ key cũ `name` và `address` cho frontend, trong đó `address` được ghép từ `address_line`, `ward`, `district`, `province`.
* User không có địa chỉ sẽ trả `addresses: []`.
* PHP lint đã pass cho `app/Services/Admin/AdminUserService.php`.
- 2026-08-01: Chuẩn hóa lại nhãn hiển thị frontend cho user/admin để dùng tiếng Việt có dấu; trên giao diện người dùng không còn hiện các cụm kỹ thuật như "giả lập ngân hàng/mô phỏng", thay bằng "Chuyển khoản ngân hàng". Đã sửa các khu vực: navbar user, sidebar/topbar admin, trang QR thanh toán, phương thức thanh toán checkout, mapper hiển thị đơn hàng/giao dịch.
- 2026-08-01: Da dong bo module admin don hang de uu tien `order.payment_status` khi hien thi danh sach, giup badge/trang thai thanh toan khop voi bo loc backend. Dong thoi da thay 3 file frontend admin order sang noi dung UTF-8 sach de loai bo chuoi tieng Viet loi ma o danh sach don va modal chi tiet.
- 2026-08-01: Da chinh lai buoc loc san pham/khuyen mai cho user. `best_selling` o `ProductService` da uu tien tong `sold_stock` cua variant active, `filterMeta` chi lay bien the con hang; `PromotionService` da ho tro day du `active`, `ending_soon`, `upcoming`, `ended`, bo mac dinh chi hien khuyen mai dang dien ra. Frontend user da dong bo lai `Promotions.jsx` va `PromotionFilters.jsx` theo nhan tieng Viet ro rang.
- 2026-08-01: Da bo sung fallback gia bien the o admin san pham. Neu admin de trong gia o bien the sau, frontend/backend se tu ke thua gia cua bien the truoc do. Seeder `ProductVariantSeeder` da chuan hoa de moi san pham co cung gia giua cac bien the; `PromotionSeeder` va `PromotionItemSeeder` da tao du 4 khuyen mai demo cho trang thai dang dien ra, sap ket thuc, sap dien ra, da ket thuc.
- 2026-08-01: Da sua rollback migration `2026_04_25_103157...` de doi du lieu `vat_invoice_requests.status` truoc roi moi `ALTER TABLE`, tranh loi `Data truncated` khi `migrate:refresh --seed`. Da bo sung rule trong `AdminPromotionService`: khuyen mai chi duoc bat khi co it nhat 1 san pham ap dung dang active; luong dang Facebook tiep tuc chi hoat dong voi khuyen mai dang bat va co san pham hop le.
- 2026-08-01: Da chot huong quan ly khuyen mai theo ton kho thuc te, bo gioi han `limit_quantity` o form admin item promotion va seeder demo. Backend tao/sua item khuyen mai gio luon luu `limit_quantity = null`, frontend admin khong con nhap gioi han rieng, danh sach san pham co the them chi hien ton kho kha dung hien tai.
- 2026-08-01: Da don sach phan frontend public khong con dung cua `FAQ` va `Gioi thieu`: xoa page, service, mapper va component React lien quan. Backend `FaqController/AboutController`, service va du lieu cu van duoc giu nguyen de tranh anh huong admin hoac cac thanh phan khac.
- 2026-08-01: Da ngung khai bao route API public cho `FAQ` va `Gioi thieu` trong `routes/api.php` vi frontend user khong con su dung. Controller/service/backend va du lieu cu van duoc giu lai, chua xoa model hay migration.
- 2026-08-01: Da go sach phan backend du thua cua luong bill va hoa don do cu. `VatInvoiceRequestService` chi con giu luong xem/tao yeu cau hoa don do; da xoa `OrderBillService` va `MockMisaInvoiceProvider` vi route download bill/PDF mock da bo tu truoc va khong con thanh phan nao su dung.
- 2026-08-01: Da don tiep phan frontend service du thua cua luong bill/hoa don do cu. `resources/js/services/orderService.js` va `guestOrderService.js` khong con giu cac method `downloadBill` / `downloadVatInvoice`, chi con luong tra cuu don va xem/tao yeu cau hoa don do dang duoc su dung thuc te.
- 2026-08-01: Da bo sung luong dang nhap Google toi thieu theo huong it anh huong: frontend tai Google Identity Services va gui `credential` ve `POST /api/auth/google`, backend xac thuc qua `https://oauth2.googleapis.com/tokeninfo`, tu dong lien ket theo `email` hoac tao moi user voi `google_id`. Can cau hinh them `GOOGLE_CLIENT_ID` va `VITE_GOOGLE_CLIENT_ID` truoc khi test thuc te. Dong thoi login thuong da tach ro thong bao `tai khoan khong ton tai` va `sai email hoac mat khau`.
- 2026-08-01: Da tam tat mem nut Google o frontend do production hien tai chay bang IP raw, khong dap ung quy dinh `Authorized JavaScript Origins` cua Google. Form dang nhap/dang ky hien chi hien nut mo cung thong bao se tich hop sau; backend route/service/migration cua Google van duoc giu nguyen de bat lai nhanh khi co domain/subdomain hop le.
- 2026-08-01: Da don tiep phan client cua Google login sau khi tat mem nut tren giao dien: `AuthContext` va `authService` khong con expose/goi luong `loginWithGoogle` nua. Frontend hien tai chi thong bao "se tich hop sau", tranh de lai handler chet; backend route/service/migration van giu nguyen.
- 2026-08-01: Da siep tiep `logic actions` cua order/payment cho user va guest lookup: chi con cho `cancel` voi don `pending` chua het han va dung theo nhom thanh toan (`mock_bank` chi khi `unpaid/failed`, `cod/cash_on_pickup` chi khi `unpaid`); `pay_again` chi hien voi don `pending` online chua het han va `payment_status` la `unpaid` hoac `failed`. Muc tieu la de UI khong hien nut sai nghiep vu truoc khi backend tu choi.
- 2026-08-01: Da dong bo timeline don hang giua user va guest lookup. Timeline guest nay co them `note` giong luong user, phan `cancelled` tach ro `Đã hết hạn` va `Đã hủy`, buoc `pickup`/`delivery` co mo ta ngan ro hon. Frontend `OrderSuccess`, `GuestOrderLookup` va `AccountOrderDetail` da hien them ghi chu duoi moi moc timeline.
## Cập nhật nhanh 2026-08-04 - hoàn thiện chatbot khuyến mãi và giao diện QR

* Khung chat AI phía người dùng không còn cắt còn 3 sản phẩm; `FloatingAIChat.jsx` đã render toàn bộ danh sách `products` backend trả về.
* `OpenAiHybridRagChatService` đã thêm nhánh `handlePromotionIntentV2()` để trả lời khuyến mãi theo dạng liệt kê tên sản phẩm, giá và mời người dùng chọn sản phẩm cần xem chi tiết.
* Chatbot đã tận dụng `metadata.products/promotions` của tin nhắn assistant gần nhất để hiểu follow-up theo ngữ cảnh như `còn sản phẩm nào nữa không?` hoặc chọn sản phẩm theo tên/số thứ tự.
* `MockPaymentQr.jsx` đã được viết lại sạch UTF-8, dùng bố cục card QR + thông tin chuyển khoản + tóm tắt đơn hàng rõ hơn để màn hình quét QR nhìn chuyên nghiệp hơn.

## Cập nhật nhanh 2026-08-04 - chuẩn hóa lại 2 báo cáo hệ thống

* Đã thay mới hoàn toàn `docs/bao-cao-he-thong-ctut-unishop.md` và `docs/bao-cao-tong-ket-ctut-unishop.md` bằng bản UTF-8 sạch, không còn lỗi mã hóa tiếng Việt.
* Nội dung báo cáo đã bám lại trạng thái hệ thống hiện tại: checkout tách `fulfillment_method` và `payment_method`, tra cứu đơn guest, tin tức thay cho blog cũ, quản lý chính sách, hóa đơn đỏ thủ công, chatbot AI lai và workflow n8n.
* Các báo cáo mới chỉ mô tả đúng những gì hệ thống đang có thật; không còn giữ các mô tả cũ dễ gây hiểu nhầm như FAQ/Giới thiệu trên frontend, blog nhiều tầng, hóa đơn điện tử tự phát hành hoặc Google login production đang hoạt động.
* Đã thêm sẵn nhiều vị trí `[Chèn Hình ...]` để tiện dàn trang Word và tách ảnh minh họa sang phần phù hợp sau này.
## Cập nhật nhanh 2026-08-20

* Đăng ký tài khoản đã mở rộng thêm địa chỉ nhận hàng ban đầu: `province`, `district`, `ward`, `address_line`, `postal_code`; sau khi đăng ký thành công backend tự tạo `addresses` mặc định cho user mới.
* Trang chi tiết sản phẩm đã thêm nút `Mua ngay`; luồng xử lý tái sử dụng `addToCartByVariant` hiện có rồi chuyển thẳng sang `/checkout` với đúng `cartItemIds` của sản phẩm vừa chọn để không kéo toàn bộ giỏ hàng vào checkout.
* Luồng tra cứu đơn guest đã được siết lại theo hướng an toàn hơn: backend/frontend chuyển từ `order_code + email` hoặc `phone + email` sang `order_code + guest_lookup_token`.
* Mỗi đơn guest mới giờ được cấp thêm `guest_lookup_token` riêng trong bảng `orders`; checkout response, session `guest_order_success`, trang kết quả đơn hàng, trang QR và trang tra cứu guest đều đã đồng bộ dùng token này.
* Guest vẫn có thể thanh toán lại, hủy đơn và gửi yêu cầu hóa đơn giá trị gia tăng, nhưng các thao tác đó giờ ưu tiên xác thực bằng `X-Guest-Lookup-Token`; `guest_token` chỉ còn là lớp hỗ trợ cho cùng trình duyệt.
* Frontend `GuestOrderLookup.jsx` đã được rút gọn thành một form duy nhất gồm `Mã đơn hàng` + `Mã tra cứu`, không còn chế độ tra cứu theo `phone + email`.
* Cần chạy migration mới `2026_08_20_170000_add_guest_lookup_token_to_orders_table.php` trước khi test tay trên môi trường thật, nếu không các luồng guest lookup/pay again/cancel mới sẽ chưa hoạt động.
* Đã bổ sung lớp xác minh chống spam cho guest checkout chuyển khoản: backend `OrderController` chỉ yêu cầu `turnstile_token` khi guest chọn `payment_method = mock_bank`, còn `cod` và `cash_on_pickup` giữ nguyên luồng cũ.
* Frontend `Checkout.jsx` đã tích hợp `TurnstileWidget.jsx`; khi có `VITE_TURNSTILE_SITE_KEY` thì widget mới hiển thị, token được gửi kèm lúc đặt hàng và tự reset nếu checkout lỗi để tránh dùng lại token cũ.
* Cấu hình mới nằm ở `config/guest_checkout.php`, `config/services.php`, `.env.example`: `GUEST_CHECKOUT_TURNSTILE_ENABLED`, `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_VERIFY_URL`.
* Đã bổ sung test backend cho 3 case: guest chuyển khoản thiếu Turnstile bị chặn, guest chuyển khoản có token hợp lệ được checkout, guest COD không bị yêu cầu Turnstile. `tests/Feature/GuestCheckoutLimitTest.php` hiện pass 22 tests.
* Đã chuẩn hóa lại `docs/chatbot-test-cases.md` theo source chatbot hiện tại: thêm thang chấm `Đúng / Đúng một phần / Sai`, công thức quy đổi độ tin cậy, checklist kỹ thuật, bộ test ngữ cảnh nối tiếp và bộ test tiếng Việt có dấu/không dấu.
* Đã thay mới `docs/chatbot-audit-report.md` để mô tả đúng kiến trúc chatbot đang chạy: GPT intent classification + database cho dữ liệu động + OpenAI Responses API / Vector Store cho dữ liệu tĩnh + metadata hội thoại cho câu hỏi nối tiếp.
* Giai đoạn chatbot trong kế hoạch góp ý Hội đồng hiện nên hiểu là đã có bộ tài liệu audit và test nền tảng để trình bày/đo độ tin cậy; chưa có số phần trăm cố định cho chatbot nếu nhóm chưa tự chạy chấm toàn bộ bộ test thủ công trên dữ liệu runtime thực tế.
* Đã nâng cấp nền tảng chatbot theo hướng `structured conversation memory` nhưng vẫn giữ kiến trúc `Hybrid RAG` hiện có:
  * thêm `ConversationMemoryService` để duy trì `context_state` theo topic `promotion/product` trên `chat_conversations`
  * thêm `ContextualReferenceResolver` để resolve follow-up như `đợt số 1`, `cái thứ 2` về canonical ID trước khi route tool
  * `OpenAiHybridRagChatService` giờ ưu tiên resolve context trước, không còn chỉ phụ thuộc `latest assistant message context`
* Đã vá bug context chính:
  * case `các đợt khuyến mãi` -> `các sản phẩm trong đợt số 1` giờ đi theo `promotion_id` thay vì đẩy text kiểu `so 1` xuống tool search
  * small talk/off-topic không tự xóa `promotion/product context`; typo không có reference signal sẽ không kéo context cũ vào
* Đã nâng tool/chat catalog theo hướng ưu tiên ID:
  * `get_promotion_products` hỗ trợ `promotion_id`
  * `get_product_price`, `get_product_stock`, `get_product_variants` hỗ trợ `product_id`
* Đã bổ sung `Approved Answer Library` cho tri thức tĩnh:
  * model `ChatbotApprovedAnswer`
  * service normalize / lexical / semantic / confidence
  * `OpenAiStaticKnowledgeService` giờ ưu tiên `approved_answer_library`, không match mới fallback sang `file_search`
* Đã bổ sung kiểm tra hiệu lực tri thức tĩnh:
  * `chat_knowledge_files` có thêm `effective_from`, `effective_to`
  * runtime `OpenAiStaticKnowledgeService` chỉ chấp nhận source còn active + completed + còn hiệu lực; nếu nguồn không hợp lệ sẽ fallback an toàn
* Đã thêm admin API backend cho thư viện câu trả lời duyệt sẵn:
  * `GET/POST /api/admin/chat/approved-answers`
  * `GET/PUT/DELETE /api/admin/chat/approved-answers/{id}`
  * `POST /api/admin/chat/approved-answers/{id}/toggle`
  * `POST /api/admin/chat/messages/{messageId}/promote-to-answer`
* Đã thêm migration mới:
  * `2026_08_20_210000_add_context_state_and_approved_answers.php`
  * migration này thêm `chat_conversations.context_state`, `chat_knowledge_files.effective_from/effective_to` và tạo bảng `chatbot_approved_answers`
* Đã thêm test regression mới cho lớp nền chatbot:
  * `tests/Unit/ConversationMemoryServiceTest.php`
  * `tests/Unit/ContextualReferenceResolverTest.php`
  * `tests/Unit/ChatbotApprovedAnswerServiceTest.php`
  * chạy bằng PHP 8.4 + SQLite schema tối thiểu: `6 tests, 18 assertions` pass
* Chưa chạy migration thật trên DB dự án và chưa chạy test end-to-end `POST /api/chat/send`; cần xác nhận môi trường DB trước khi test tay toàn luồng.
* Đã nối thêm admin UI cho chatbot:
  * thêm trang `Approved Answers AI` ở route `/admin/chat-approved-answers`
  * có list/filter/paging, form tạo-sửa, toggle active, xóa
  * có thể promote trực tiếp từ một assistant message trong màn `Hội thoại AI` sang thư viện approved answers
* Màn `AdminChatConversations` đã mở rộng debug context:
  * hiển thị `conversation.context_state`
  * hiển thị `answer_source`, `confidence`, `resolution`, `context_reference`
  * giúp debug rõ chatbot đang đi theo `database`, `approved_answer_library`, `vector_store` hay `clarify`
* Frontend build production đã pass sau đợt nối admin UI chatbot bằng Node bundled của workspace.
