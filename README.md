# CTUT Store (NCKH)

> Hệ thống thương mại điện tử dành cho Trường Đại học Kỹ thuật - Công nghệ Cần Thơ (CTUT).

---

# Tổng quan

CTUT Store là hệ thống thương mại điện tử được xây dựng theo mô hình:

* Laravel 10 REST API
* React 18 Single Page Application
* Vite
* MySQL
* Docker (n8n)
* OpenAI
* VNPay

Business Logic được triển khai theo **Service Pattern** nhằm dễ bảo trì và mở rộng.

---

# Công nghệ sử dụng

## Backend

* PHP 8.1+
* Laravel 10
* Sanctum
* Eloquent ORM
* Queue
* Event / Listener

## Frontend

* React 18
* Vite
* Tailwind CSS
* Axios
* React Router

## Database

* MySQL

## External Services

* OpenAI API
* VNPay
* n8n

---

# Kiến trúc

```text
Browser
    │
    ▼
React SPA
    │
    ▼
Axios
    │
    ▼
Laravel API
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Model
    │
    ▼
Database
```

Controller chỉ xử lý Request / Response.

Business Logic nằm trong Service.

---

# Các module chính

* Authentication
* User Management
* Product
* Category
* Department
* Cart
* Checkout
* Order
* Payment
* Inventory
* Promotion
* Review
* Notification
* CMS
* Admin Dashboard
* OpenAI Chatbot
* Knowledge Upload
* Social Automation (n8n)

---

# Cấu trúc thư mục

```
app/
resources/
routes/
database/
storage/
public/
docs/
```

---

# Branch phát triển

Branch chính:

```
mong
```

---

# Chạy dự án

## Backend

```bash
composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan storage:link

php artisan serve
```

---

## Frontend

```bash
npm install

npm run dev
```

---

# Docker

Docker hiện được sử dụng cho:

* n8n
* Automation

Laravel chạy trực tiếp bằng Laragon trong môi trường phát triển.

---

# AI Coding

Quy tắc làm việc của AI được định nghĩa trong:

```
AGENTS.md
```

Mọi AI Agent (Codex, ChatGPT...) nên đọc file này trước khi phân tích hoặc sửa mã nguồn.

---

# Troubleshooting

Các lỗi đã gặp và cách xử lý được lưu trong:

```
docs/troubleshooting.md
```

Đây là tài liệu sống và nên được cập nhật khi xử lý xong các lỗi quan trọng.

---

# License

Internal Project - CTUT Store
