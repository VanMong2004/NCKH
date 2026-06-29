# AGENTS.md

# CTUT Store (NCKH)

AI Coding Instructions

Version: 2.0

---

# Language

* Luôn trả lời bằng tiếng Việt.
* Chỉ dùng tiếng Anh khi tôi yêu cầu.
* Không dịch tên class, function, method, route, table, field, biến hoặc đoạn code.
* Khi giải thích lỗi, ưu tiên giải thích bằng tiếng Việt trước, sau đó mới đưa code nếu cần.

---

# Project

Tên dự án:

CTUT Store (NCKH)

Tech Stack:

Backend

* Laravel 10
* PHP 8.1+
* Laravel Sanctum
* Eloquent ORM

Frontend

* React 18
* Vite
* Tailwind CSS
* Axios

Infrastructure

* MySQL
* Docker (n8n)

External Services

* OpenAI API
* VNPay

Git

* Branch làm việc chính: `mong`

Không tự checkout sang branch khác.

---

# Working Style

Đây là dự án đang trong giai đoạn phát triển.

Ưu tiên:

* sửa ít
* an toàn
* không làm hỏng chức năng đang chạy

Không tối ưu hóa nếu tôi không yêu cầu.

Không refactor nếu tôi không yêu cầu.

---

# Analyze First

Đây là quy tắc quan trọng nhất.

Nếu tôi báo lỗi.

KHÔNG được sửa ngay.

Luôn thực hiện theo thứ tự:

1. Đọc source code.
2. Phân tích luồng xử lý.
3. Xác định nguyên nhân gốc.
4. Giải thích bằng tiếng Việt.
5. Đề xuất hướng sửa.
6. Chờ tôi đồng ý.
7. Mới sửa code.

---

# Debug Workflow

Luôn đọc theo thứ tự:

Route

↓

Middleware

↓

Controller

↓

FormRequest (nếu có)

↓

Service

↓

Model

↓

Migration

↓

Frontend Service (Axios)

↓

React Component

↓

Laravel Log

↓

Browser Console

Không kết luận chỉ dựa trên một file.

---

# Backend Rules

Controller chỉ nên:

* nhận request
* validate
* authorize
* gọi service
* trả response

Không viết business logic trong Controller.

Business logic phải nằm trong Service.

Model chỉ quản lý dữ liệu.

---

# Frontend Rules

Frontend sử dụng React.

API nằm trong:

resources/js/services

Nếu backend thay đổi response.

Luôn kiểm tra:

* React Page
* React Component
* Admin Component

Không thay đổi UI nếu tôi không yêu cầu.

---

# API Rules

Không tự ý:

* đổi JSON Response
* đổi HTTP Status
* đổi key response

Nếu cần thay đổi API.

Luôn kiểm tra frontend đang sử dụng.

---

# Checkout Rules

Khi tôi nói:

"Checkout lỗi"

Luôn kiểm tra:

* Cart
* Checkout
* Order
* Payment
* Promotion
* Inventory

Không sửa Checkout khi chưa hiểu toàn bộ flow.

---

# Payment Rules

Project sử dụng:

* COD
* VNPay
* Mock Payment

Khi sửa Payment.

Luôn kiểm tra:

* CheckoutService
* PaymentService
* PaymentController
* OrderService

Không thay đổi callback nếu tôi chưa yêu cầu.

---

# Authentication Rules

Khi sửa Login.

Luôn kiểm tra:

* Sanctum
* AuthController
* AuthService
* Middleware
* React Login
* Axios

---

# Admin Rules

Backend Admin:

app/Services/Admin

Frontend Admin:

resources/js/admin

Nếu sửa backend admin.

Luôn kiểm tra frontend admin.

---

# AI Rules

Project có:

* OpenAI
* Vector Store
* Knowledge Upload
* Chatbot

Không thay đổi workflow AI nếu tôi không yêu cầu.

---

# n8n Rules

Project có:

* Knowledge Sync
* Social Automation
* Webhook
* Callback

Không tự ý:

* đổi webhook
* đổi callback
* đổi secret

---

# Git Rules

Không tự:

* commit
* push
* merge
* rebase
* reset
* checkout branch khác

nếu tôi chưa yêu cầu.

---

# Dangerous Commands

Luôn hỏi xác nhận trước khi chạy:

* php artisan migrate
* php artisan migrate:fresh
* php artisan db:seed
* composer install
* composer update
* npm install
* npm update
* git reset
* git clean
* git push
* rm
* del

---

# Coding Rules

Ưu tiên:

* sửa tối thiểu
* giữ nguyên coding style
* giữ nguyên kiến trúc

Không tự:

* đổi namespace
* đổi tên class
* đổi tên function
* đổi route
* đổi response

Nếu có nhiều cách sửa.

Luôn đề xuất:

* Cách 1 (ít ảnh hưởng nhất) ⭐ Khuyến nghị
* Cách 2
* Cách 3

---

# Response Format

Khi phân tích bug.

Luôn trả lời theo mẫu.

## Hiện tượng

## Nguyên nhân

## File liên quan

## Hướng sửa

## Rủi ro

Sau đó mới viết code.

---

# Code Modification

Nếu tôi chỉ hỏi:

* "vì sao?"
* "phân tích"
* "kiểm tra"

→ Không sửa code.

Nếu tôi nói:

* "hãy sửa"
* "fix"
* "viết lại"

→ Mới được sửa.

---

# Project Context

Luôn ưu tiên đọc source code hiện tại.

Không dựa vào tài liệu cũ nếu source code đã thay đổi.

Source code luôn là nguồn thông tin chính xác nhất.

---

# Primary Goal

Mục tiêu cao nhất:

* Phân tích chính xác.
* Giải thích rõ ràng.
* Sửa ít nhất có thể.
* Không làm ảnh hưởng chức năng khác.
* Giữ dự án ổn định.

Nếu yêu cầu chưa rõ.

Hãy hỏi lại.

Không tự suy đoán.
