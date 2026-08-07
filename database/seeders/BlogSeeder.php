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
                'content' => <<<HTML
<p>CTUT UniShop hỗ trợ người dùng tra cứu và đăng ký các sản phẩm mang thương hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ ngay trên môi trường trực tuyến.</p>

<h3>1. Chọn sản phẩm</h3>
<p>Người dùng truy cập danh sách sản phẩm, tìm kiếm theo tên hoặc lọc theo danh mục. Tại trang chi tiết sản phẩm, người dùng có thể xem hình ảnh, mô tả, giá bán, các biến thể như kích thước, màu sắc và tình trạng còn hàng.</p>

<h3>2. Thêm sản phẩm vào giỏ hàng</h3>
<p>Sau khi chọn đúng biến thể và số lượng, người dùng thêm sản phẩm vào giỏ hàng. Hệ thống sẽ kiểm tra số lượng tồn kho trước khi tiếp tục. Người dùng có thể thay đổi số lượng hoặc xóa sản phẩm khỏi giỏ trước khi đặt hàng.</p>

<h3>3. Nhập thông tin nhận hàng</h3>
<p>Người dùng đã đăng nhập có thể chọn địa chỉ đã lưu. Khách chưa có tài khoản vẫn có thể đặt hàng bằng cách nhập họ tên, email, số điện thoại và các thông tin nhận hàng cần thiết.</p>

<h3>4. Chọn phương thức nhận sản phẩm</h3>
<p>CTUT UniShop hỗ trợ hai hình thức nhận sản phẩm:</p>
<ul>
    <li><strong>Giao hàng tận nơi:</strong> sản phẩm được giao đến địa chỉ mà người dùng cung cấp.</li>
    <li><strong>Nhận trực tiếp tại Trường:</strong> người dùng đến địa điểm được thông báo để nhận sản phẩm.</li>
</ul>

<h3>5. Chọn phương thức thanh toán</h3>
<p>Tùy phương thức nhận hàng, người dùng có thể lựa chọn thanh toán khi nhận hàng, thanh toán trực tiếp khi nhận tại Trường hoặc thanh toán ngân hàng trên hệ thống.</p>

<p>Sau khi đơn hàng được tạo thành công, người dùng có thể theo dõi trạng thái xử lý trong tài khoản cá nhân. Khách chưa đăng nhập có thể sử dụng chức năng tra cứu đơn hàng bằng thông tin xác minh.</p>
HTML,
            ],

            [
                'title' => 'Hướng dẫn nhận hàng tại Phòng Công tác chính trị - Sinh viên - Khởi nghiệp',
                'summary' => 'Quy trình nhận hàng tại trường dành cho đơn pickup hoặc thanh toán tại phòng.',
                'featured' => true,
                'content' => <<<HTML
<p>CTUT UniShop hỗ trợ hình thức nhận sản phẩm trực tiếp tại Trường dành cho người dùng không có nhu cầu giao hàng tận nơi.</p>

<h3>1. Chọn nhận hàng tại Trường</h3>
<p>Tại bước đặt hàng, người dùng chọn phương thức <strong>Nhận trực tiếp tại Trường</strong>. Với hình thức này, hệ thống không tính phí vận chuyển.</p>

<h3>2. Lựa chọn thanh toán</h3>
<p>Người dùng có thể lựa chọn một trong các hình thức sau:</p>
<ul>
    <li>Thanh toán trực tiếp khi đến nhận sản phẩm.</li>
    <li>Thanh toán ngân hàng trước khi nhận sản phẩm.</li>
</ul>

<h3>3. Theo dõi trạng thái đơn hàng</h3>
<p>Sau khi đặt hàng, đơn được quản trị viên tiếp nhận và chuẩn bị. Khi sản phẩm đã sẵn sàng, trạng thái đơn hàng được cập nhật để người dùng biết thời điểm có thể đến nhận.</p>

<h3>4. Nhận sản phẩm</h3>
<p>Khi đến nhận hàng, người dùng nên cung cấp mã đơn hàng hoặc thông tin đã sử dụng khi đặt hàng để cán bộ phụ trách kiểm tra. Sau khi xác nhận thông tin và hoàn tất thanh toán nếu cần, sản phẩm sẽ được bàn giao và đơn hàng được cập nhật sang trạng thái hoàn thành.</p>

<p>Người dùng nên kiểm tra trạng thái đơn hàng trên CTUT UniShop trước khi đến Trường để tránh trường hợp sản phẩm chưa được chuẩn bị xong.</p>
HTML,
            ],

            [
                'title' => 'Các phương thức thanh toán đang được hỗ trợ',
                'summary' => 'Tổng hợp các hình thức thanh toán hiện có tại CTUT UniShop.',
                'featured' => false,
                'content' => <<<HTML
<p>CTUT UniShop hỗ trợ nhiều phương thức thanh toán tương ứng với hình thức nhận sản phẩm mà người dùng lựa chọn.</p>

<h3>1. Giao hàng tận nơi - Thanh toán khi nhận hàng</h3>
<p>Người dùng thanh toán khi nhận được sản phẩm. Sau khi đặt hàng, trạng thái thanh toán được ghi nhận là chưa thanh toán cho đến khi đơn được xử lý hoàn tất theo nghiệp vụ.</p>

<h3>2. Giao hàng tận nơi - Thanh toán ngân hàng</h3>
<p>Người dùng có thể thực hiện quy trình thanh toán ngân hàng trên CTUT UniShop. Hệ thống ghi nhận kết quả thành công hoặc thất bại và cập nhật trạng thái thanh toán tương ứng.</p>

<h3>3. Nhận tại Trường - Thanh toán trực tiếp</h3>
<p>Người dùng đến nhận sản phẩm tại địa điểm được thông báo và thực hiện thanh toán trực tiếp khi nhận hàng.</p>

<h3>4. Nhận tại Trường - Thanh toán ngân hàng</h3>
<p>Người dùng có thể hoàn tất thanh toán trước, sau đó đến nhận sản phẩm khi đơn hàng đã được chuẩn bị.</p>

<h3>Lưu ý</h3>
<p>Chức năng thanh toán ngân hàng hiện được xây dựng để phục vụ nghiên cứu và kiểm thử quy trình. Hệ thống chưa thực hiện giao dịch ngân hàng thật trong phạm vi triển khai hiện tại.</p>

<p>Nếu một lần thanh toán thất bại, hệ thống có thể cho phép người dùng thực hiện lại mà vẫn lưu lịch sử của lần thanh toán trước.</p>
HTML,
            ],

            [
                'title' => 'Quy trình yêu cầu xuất hóa đơn đỏ',
                'summary' => 'Những thông tin cần cung cấp khi gửi yêu cầu xuất hóa đơn đỏ.',
                'featured' => false,
                'content' => <<<HTML
<p>CTUT UniShop hỗ trợ tiếp nhận và quản lý yêu cầu xuất hóa đơn đỏ đối với các đơn hàng đáp ứng điều kiện của hệ thống.</p>

<h3>1. Điều kiện gửi yêu cầu</h3>
<p>Yêu cầu hóa đơn chỉ được tiếp nhận đối với đơn hàng đã được thanh toán. Người dùng cần kiểm tra trạng thái thanh toán của đơn trước khi gửi yêu cầu.</p>

<h3>2. Thông tin cần cung cấp</h3>
<p>Khi gửi yêu cầu, người dùng cần nhập đầy đủ các thông tin gồm:</p>
<ul>
    <li>Tên đơn vị hoặc tổ chức.</li>
    <li>Mã số thuế.</li>
    <li>Địa chỉ đơn vị.</li>
    <li>Email nhận thông tin hóa đơn.</li>
    <li>Ghi chú bổ sung nếu có.</li>
</ul>

<h3>3. Quá trình xử lý</h3>
<p>Sau khi tiếp nhận, yêu cầu được quản trị viên kiểm tra và cập nhật theo các trạng thái như chờ xử lý, đang xử lý, hoàn tất hoặc từ chối.</p>

<h3>4. Thông báo kết quả</h3>
<p>Khi trạng thái yêu cầu thay đổi, hệ thống có thể gửi email thông báo đến địa chỉ mà người dùng đã cung cấp.</p>

<p>Chức năng hiện tập trung vào việc tiếp nhận, quản lý và theo dõi yêu cầu hóa đơn. Việc phát hành hóa đơn điện tử chính thức không được thực hiện trực tiếp bởi CTUT UniShop trong phạm vi của hệ thống hiện tại.</p>
HTML,
            ],

            [
                'title' => 'Thông báo ra mắt sản phẩm đồng phục CTUT mới',
                'summary' => 'Cập nhật các sản phẩm đồng phục mới dành cho sinh viên và người dùng CTUT UniShop.',
                'featured' => false,
                'content' => <<<HTML
<p>CTUT UniShop cập nhật các sản phẩm đồng phục mang nhận diện của Trường Đại học Kỹ thuật - Công nghệ Cần Thơ nhằm giúp sinh viên và người dùng thuận tiện hơn trong việc tìm hiểu và đăng ký sản phẩm.</p>

<p>Các sản phẩm được cập nhật trên hệ thống có thể bao gồm áo thun, áo khoác, hoodie, nón và các sản phẩm nhận diện khác. Tùy từng sản phẩm, người dùng có thể lựa chọn kích thước, màu sắc và biến thể phù hợp.</p>

<h3>Tra cứu thông tin sản phẩm</h3>
<p>Người dùng có thể truy cập danh sách sản phẩm để xem hình ảnh, mô tả, giá bán, biến thể và tình trạng còn hàng. Thông tin tồn kho được quản lý theo từng biến thể nhằm hỗ trợ lựa chọn chính xác hơn.</p>

<h3>Đặt hàng trực tuyến</h3>
<p>Sau khi chọn sản phẩm, người dùng có thể thêm vào giỏ hàng và thực hiện đặt hàng trực tiếp trên CTUT UniShop. Hệ thống hỗ trợ giao hàng tận nơi hoặc nhận sản phẩm trực tiếp tại Trường.</p>

<p>Các sản phẩm mới và thông tin cập nhật sẽ tiếp tục được bổ sung trên CTUT UniShop trong quá trình vận hành.</p>
HTML,
            ],

            [
                'title' => 'Thông báo chương trình khuyến mãi đầu năm học',
                'summary' => 'Danh sách ưu đãi đang diễn ra dành cho năm học mới.',
                'featured' => false,
                'content' => <<<HTML
<p>Nhằm hỗ trợ người dùng tiếp cận các sản phẩm mang thương hiệu Trường thuận tiện hơn, CTUT UniShop có thể triển khai các chương trình ưu đãi trong từng thời điểm.</p>

<h3>Thông tin chương trình</h3>
<p>Mỗi chương trình khuyến mãi được hiển thị với thời gian bắt đầu, thời gian kết thúc, sản phẩm áp dụng và mức giảm tương ứng. Mức ưu đãi có thể được thiết lập theo tỷ lệ phần trăm hoặc theo giá trị giảm cụ thể.</p>

<h3>Cách xem sản phẩm đang khuyến mãi</h3>
<p>Người dùng có thể truy cập trang sản phẩm hoặc khu vực khuyến mãi để xem những sản phẩm đang được áp dụng ưu đãi. Giá sau giảm được hệ thống tính dựa trên chương trình đang còn hiệu lực.</p>

<h3>Lưu ý</h3>
<p>Chương trình chỉ áp dụng trong thời gian được công bố và đối với các sản phẩm được chỉ định. Khi chương trình kết thúc, hệ thống tự động sử dụng lại giá thông thường của sản phẩm.</p>

<p>Thông tin chương trình khuyến mãi trên CTUT UniShop là nguồn thông tin chính để người dùng kiểm tra mức ưu đãi đang được áp dụng.</p>
HTML,
            ],
        ];

        foreach ($blogs as $index => $blog) {
            $slug = Str::slug($blog['title']);

            Blog::updateOrCreate(
                [
                    'slug' => $slug,
                ],
                [
                    'title' => $blog['title'],
                    'slug' => $slug,
                    'summary' => $blog['summary'],
                    'excerpt' => $blog['summary'],
                    'content' => $blog['content'],
                    'thumbnail' => 'images/blogs/' . ($index + 1) . '.jpg',
                    'status' => 'published',
                    'is_published' => true,
                    'is_featured' => $blog['featured'],
                    'published_at' => now()->subDays($index),
                ]
            );
        }
    }
}