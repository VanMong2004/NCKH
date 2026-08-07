<?php

namespace Database\Seeders;

use App\Models\Policy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            [
                'title' => 'Chính sách đổi trả',
                'type' => 'policy',
                'content' => <<<HTML
<h3>1. Phạm vi áp dụng</h3>
<p>Chính sách đổi trả áp dụng đối với các sản phẩm được đăng ký và cung cấp thông qua CTUT UniShop khi sản phẩm giao cho người dùng không đúng với thông tin của đơn hàng hoặc phát sinh lỗi cần được kiểm tra.</p>

<h3>2. Các trường hợp được xem xét đổi sản phẩm</h3>
<ul>
    <li>Sản phẩm nhận được không đúng sản phẩm hoặc biến thể đã đăng ký.</li>
    <li>Sản phẩm bị lỗi hoặc hư hỏng trước khi bàn giao cho người dùng.</li>
    <li>Số lượng sản phẩm nhận được không đúng với đơn hàng đã được xác nhận.</li>
</ul>

<h3>3. Điều kiện xử lý</h3>
<p>Người dùng cần cung cấp mã đơn hàng và thông tin liên quan để quản trị viên kiểm tra. Sản phẩm cần được giữ ở tình trạng phù hợp để phục vụ việc đối chiếu và xử lý.</p>

<h3>4. Quy trình xử lý</h3>
<p>Người dùng liên hệ với đơn vị phụ trách hoặc gửi thông tin qua chức năng liên hệ trên CTUT UniShop. Sau khi tiếp nhận, quản trị viên kiểm tra đơn hàng và tình trạng sản phẩm trước khi đưa ra phương án xử lý phù hợp.</p>

<h3>5. Lưu ý</h3>
<p>Việc đổi trả được xem xét dựa trên tình trạng thực tế của sản phẩm và thông tin đơn hàng. Các trường hợp phát sinh do người dùng lựa chọn sai kích thước, màu sắc hoặc biến thể có thể cần được đơn vị phụ trách xem xét riêng.</p>
HTML,
            ],

            [
                'title' => 'Chính sách vận chuyển',
                'type' => 'policy',
                'content' => <<<HTML
<h3>1. Phương thức nhận sản phẩm</h3>
<p>CTUT UniShop hỗ trợ hai phương thức nhận sản phẩm gồm giao hàng tận nơi và nhận trực tiếp tại Trường.</p>

<h3>2. Giao hàng tận nơi</h3>
<p>Đối với đơn giao hàng tận nơi, người dùng cần cung cấp đầy đủ họ tên, email, số điện thoại, tỉnh/thành phố, quận/huyện, phường/xã và địa chỉ nhận hàng.</p>

<p>Phí vận chuyển hiện được hệ thống tính là <strong>35.000 đồng cho mỗi đơn hàng giao tận nơi</strong> trong phạm vi triển khai thử nghiệm.</p>

<h3>3. Nhận trực tiếp tại Trường</h3>
<p>Người dùng có thể lựa chọn nhận sản phẩm trực tiếp tại địa điểm được thông báo bởi đơn vị phụ trách. Hình thức này không tính phí vận chuyển.</p>

<h3>4. Theo dõi trạng thái</h3>
<p>Người dùng nên theo dõi trạng thái đơn hàng trên CTUT UniShop. Khi đơn đã được chuẩn bị hoặc chuyển sang trạng thái chờ nhận, người dùng có thể thực hiện bước nhận sản phẩm theo hướng dẫn.</p>

<h3>5. Thông tin nhận hàng</h3>
<p>Người dùng có trách nhiệm cung cấp thông tin nhận hàng chính xác. Trường hợp thông tin không đầy đủ hoặc không thể liên hệ, thời gian xử lý đơn hàng có thể bị ảnh hưởng.</p>
HTML,
            ],

            [
                'title' => 'Chính sách bảo mật',
                'type' => 'policy',
                'content' => <<<HTML
<h3>1. Thông tin được thu thập</h3>
<p>CTUT UniShop có thể lưu trữ các thông tin cần thiết để cung cấp dịch vụ như họ tên, email, số điện thoại, địa chỉ nhận hàng, thông tin tài khoản, đơn hàng và lịch sử giao dịch trên hệ thống.</p>

<h3>2. Mục đích sử dụng</h3>
<p>Thông tin được sử dụng để xác thực tài khoản, xử lý đơn hàng, liên hệ với người dùng, hỗ trợ giao nhận, quản lý thanh toán, gửi thông báo và phục vụ công tác thống kê trong phạm vi CTUT UniShop.</p>

<h3>3. Bảo vệ tài khoản</h3>
<p>Người dùng có trách nhiệm bảo mật thông tin đăng nhập và không chia sẻ mật khẩu cho người khác. Khi phát hiện hoạt động bất thường, người dùng nên liên hệ với đơn vị quản trị hệ thống.</p>

<h3>4. Quyền truy cập dữ liệu</h3>
<p>Hệ thống áp dụng cơ chế xác thực và phân quyền để giới hạn chức năng theo vai trò. Người dùng thông thường không được truy cập khu vực quản trị và không được phép xem dữ liệu đơn hàng không thuộc phạm vi được xác minh.</p>

<h3>5. Dịch vụ tích hợp</h3>
<p>Một số chức năng của CTUT UniShop sử dụng các dịch vụ hỗ trợ như OpenAI, n8n, dịch vụ email và Facebook Graph API. Dữ liệu gửi đến các dịch vụ này được giới hạn theo yêu cầu của từng chức năng.</p>

<h3>6. Phạm vi triển khai</h3>
<p>CTUT UniShop hiện được xây dựng trong phạm vi nghiên cứu và triển khai thử nghiệm. Các cơ chế bảo mật, sao lưu và giám sát sẽ tiếp tục được hoàn thiện trước khi hệ thống được đưa vào sử dụng chính thức ở quy mô lớn.</p>
HTML,
            ],

            [
                'title' => 'Điều khoản sử dụng',
                'type' => 'terms',
                'content' => <<<HTML
<h3>1. Phạm vi sử dụng</h3>
<p>CTUT UniShop là cổng dịch vụ số hỗ trợ tra cứu, đăng ký và quản lý các sản phẩm mang thương hiệu Trường Đại học Kỹ thuật - Công nghệ Cần Thơ.</p>

<h3>2. Trách nhiệm của người dùng</h3>
<p>Người dùng cần cung cấp thông tin chính xác khi đăng ký tài khoản hoặc đặt hàng. Người dùng không được sử dụng hệ thống để thực hiện các hành vi gây ảnh hưởng đến dữ liệu, tài khoản hoặc hoạt động của người dùng khác.</p>

<h3>3. Đặt hàng</h3>
<p>Khi gửi yêu cầu đặt hàng, người dùng xác nhận các thông tin về sản phẩm, biến thể, số lượng, thông tin người nhận, phương thức nhận sản phẩm và phương thức thanh toán đã lựa chọn.</p>

<p>Đơn hàng chỉ được xử lý khi đáp ứng các điều kiện về thông tin và số lượng tồn kho của hệ thống.</p>

<h3>4. Thanh toán</h3>
<p>CTUT UniShop hỗ trợ các phương thức thanh toán tương ứng với phương thức nhận sản phẩm. Chức năng thanh toán ngân hàng hiện được triển khai ở mức mô phỏng nhằm phục vụ nghiên cứu và kiểm thử, chưa phải giao dịch ngân hàng thật.</p>

<h3>5. Trạng thái đơn hàng</h3>
<p>Người dùng có thể theo dõi quá trình xử lý đơn hàng thông qua hệ thống. Đơn hàng có thể được xác nhận, chuẩn bị, chờ nhận, hoàn thành hoặc hủy tùy theo tình trạng thực tế.</p>

<h3>6. Nội dung và dữ liệu</h3>
<p>Thông tin sản phẩm, giá, tồn kho, chương trình khuyến mãi và chính sách có thể được quản trị viên cập nhật theo tình hình thực tế. Người dùng nên kiểm tra thông tin hiển thị trên hệ thống tại thời điểm đặt hàng.</p>

<h3>7. Phạm vi hệ thống</h3>
<p>CTUT UniShop hiện được triển khai trong phạm vi đề tài nghiên cứu khoa học và phục vụ thử nghiệm tại Trường. Một số chức năng có thể tiếp tục được điều chỉnh hoặc mở rộng trước khi đưa vào vận hành chính thức.</p>
HTML,
            ],
        ];

        foreach ($policies as $index => $item) {
            $slug = Str::slug($item['title']);

            Policy::updateOrCreate(
                [
                    'slug' => $slug,
                ],
                [
                    'title' => $item['title'],
                    'slug' => $slug,
                    'type' => $item['type'],
                    'content' => $item['content'],
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }
}