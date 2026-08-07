<?php

namespace Database\Seeders;

use App\Models\Blog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $blogs = [
            [
                'title' => 'Hướng dẫn đặt hàng trên CTUT UniShop',
                'summary' => 'Các bước chọn sản phẩm, phương thức nhận hàng và thanh toán trên hệ thống.',
                'featured' => true,
            ],
            [
                'title' => 'Hướng dẫn nhận hàng tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp',
                'summary' => 'Quy trình nhận hàng tại trường dành cho đơn pickup hoặc thanh toán tại phòng.',
                'featured' => true,
            ],
            [
                'title' => 'Các phương thức thanh toán đang được hỗ trợ',
                'summary' => 'Tổng hợp các hình thức thanh toán hiện có tại CTUT UniShop.',
                'featured' => false,
            ],
            [
                'title' => 'Quy trình yêu cầu xuất hóa đơn đỏ',
                'summary' => 'Những thông tin cần cung cấp khi gửi yêu cầu xuất hóa đơn đỏ.',
                'featured' => false,
            ],
            [
                'title' => 'Thông báo ra mắt sản phẩm đồng phục CTUT mới',
                'summary' => 'Cập nhật các sản phẩm đồng phục mới dành cho sinh viên và giảng viên.',
                'featured' => false,
            ],
            [
                'title' => 'Thông báo chương trình khuyến mãi đầu năm học',
                'summary' => 'Danh sách ưu đãi đang diễn ra dành cho năm học mới.',
                'featured' => false,
            ],
        ];

        foreach ($blogs as $index => $blog) {
            $slug = Str::slug($blog['title']);

            Blog::updateOrCreate([
                'slug' => $slug,
            ], [
                'title' => $blog['title'],
                'slug' => $slug,
                'summary' => $blog['summary'],
                'content' => "<p>{$blog['summary']}</p><p>Nội dung chi tiết bài viết đang được cập nhật để phục vụ demo hệ thống.</p>",
                'thumbnail' => 'images/blogs/' . ($index + 1) . '.jpg',
                'status' => 'published',
                'is_featured' => $blog['featured'],
                'published_at' => now()->subDays($index),
            ]);
        }
    }
}