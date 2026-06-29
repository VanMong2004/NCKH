# Troubleshooting

> Nhật ký các lỗi đã gặp trong quá trình phát triển CTUT Store.

---

# Hướng dẫn

Mỗi bug nên ghi theo mẫu:

```md
## YYYY-MM-DD

### Module

### Hiện tượng

### Nguyên nhân

### Cách xử lý

### File liên quan

### Ghi chú
```

---

# Ví dụ

## 2026-06-28

### Module

Checkout

### Hiện tượng

Thanh toán trả về HTTP 500.

### Nguyên nhân

CheckoutService không xử lý đúng transaction khi tạo Order và Payment.

### Cách xử lý

Đưa toàn bộ quá trình tạo Order + Payment vào cùng một `DB::transaction()`.

### File liên quan

* CheckoutService.php
* PaymentService.php

---

## 2026-06-28

### Module

Authentication

### Hiện tượng

Đăng nhập thành công nhưng React vẫn chuyển về Login.

### Nguyên nhân

Frontend chưa lưu token hoặc Axios chưa gửi Authorization Header.

### Cách xử lý

Kiểm tra:

* AuthService
* Axios Interceptor
* Sanctum Token

---

## 2026-06-28

### Module

VNPay

### Hiện tượng

Return URL báo sai chữ ký.

### Nguyên nhân

Sai Hash Secret hoặc sai thứ tự dữ liệu ký.

### Cách xử lý

Kiểm tra:

* VNPayService
* Config
* .env

---

## 2026-06-28

### Module

OpenAI

### Hiện tượng

Knowledge Upload luôn ở trạng thái Processing.

### Nguyên nhân

n8n callback không cập nhật trạng thái.

### Cách xử lý

Kiểm tra:

* Webhook
* Callback
* Queue
* N8N Secret

---

## 2026-06-28

### Module

Social Automation

### Hiện tượng

Webhook trả về 403.

### Nguyên nhân

Sai Secret hoặc callback không hợp lệ.

### Cách xử lý

Kiểm tra:

* N8N_SOCIAL_SECRET
* Header
* Route

---

# Quy tắc

* Chỉ ghi các lỗi đã xác định được nguyên nhân.
* Không ghi lỗi chưa phân tích xong.
* Mỗi lỗi nên có ngày, nguyên nhân và cách xử lý.
* Nếu lỗi lặp lại, cập nhật vào mục cũ thay vì tạo mục mới.
