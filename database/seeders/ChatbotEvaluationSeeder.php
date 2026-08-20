<?php

namespace Database\Seeders;

use App\Models\ChatbotApprovedAnswer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ChatbotEvaluationSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedGuestOrders();
        $this->seedApprovedAnswers();
    }

    private function seedGuestOrders(): void
    {
        $orders = [
            [
                'order_code' => 'ORD-EVAL-00001',
                'guest_token' => 'guest-eval-00001',
                'guest_lookup_token' => 'GLK-EVAL-00001',
                'guest_name' => 'Nguyen Van Guest',
                'guest_email' => 'guest.eval1@example.com',
                'guest_phone' => '0912345678',
                'shipping_name' => 'Nguyen Van Guest',
                'shipping_phone' => '0912345678',
                'shipping_address' => 'Khu II, Ninh Kieu, Can Tho',
                'fulfillment_method' => 'delivery',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'mock_bank',
                'items' => [
                    ['product' => 'Áo thun CTUT K2026', 'size' => 'M', 'color' => 'Xanh CTUT', 'quantity' => 1],
                    ['product' => 'Sticker CTUT', 'quantity' => 1],
                ],
            ],
            [
                'order_code' => 'ORD-EVAL-00002',
                'guest_token' => 'guest-eval-00002',
                'guest_lookup_token' => 'GLK-EVAL-00002',
                'guest_name' => 'Tran Thi Guest',
                'guest_email' => 'guest.eval2@example.com',
                'guest_phone' => '0988123456',
                'shipping_name' => 'Tran Thi Guest',
                'shipping_phone' => '0988123456',
                'shipping_address' => 'Phong Cong tac chinh tri - Sinh vien - Khoi nghiep CTUT',
                'fulfillment_method' => 'pickup',
                'status' => 'awaiting_receipt',
                'payment_status' => 'paid',
                'payment_method' => 'cash_on_pickup',
                'items' => [
                    ['product' => 'Ly giữ nhiệt CTUT', 'quantity' => 1],
                ],
            ],
            [
                'order_code' => 'ORD-EVAL-00003',
                'guest_token' => 'guest-eval-00003',
                'guest_lookup_token' => 'GLK-EVAL-00003',
                'guest_name' => 'Le Guest',
                'guest_email' => 'guest.eval3@example.com',
                'guest_phone' => '0909000111',
                'shipping_name' => 'Le Guest',
                'shipping_phone' => '0909000111',
                'shipping_address' => 'Duong 3/2, Ninh Kieu, Can Tho',
                'fulfillment_method' => 'delivery',
                'status' => 'completed',
                'payment_status' => 'paid',
                'payment_method' => 'cod',
                'items' => [
                    ['product' => 'Bảng tên sinh viên CTUT', 'quantity' => 1],
                ],
            ],
        ];

        foreach ($orders as $data) {
            $order = Order::updateOrCreate(
                ['order_code' => $data['order_code']],
                [
                    'user_id' => null,
                    'guest_token' => $data['guest_token'],
                    'guest_lookup_token' => $data['guest_lookup_token'],
                    'guest_name' => $data['guest_name'],
                    'guest_email' => $data['guest_email'],
                    'guest_phone' => $data['guest_phone'],
                    'fulfillment_method' => $data['fulfillment_method'],
                    'shipping_fee' => $data['fulfillment_method'] === 'pickup' ? 0 : 35000,
                    'shipping_name' => $data['shipping_name'],
                    'shipping_phone' => $data['shipping_phone'],
                    'shipping_address' => $data['shipping_address'],
                    'sub_total' => 0,
                    'discount_total' => 0,
                    'grand_total' => 0,
                    'total' => 0,
                    'status' => $data['status'],
                    'payment_status' => $data['payment_status'],
                    'expired_at' => $data['payment_status'] === 'unpaid' ? now()->addMinutes(30) : null,
                    'cancel_reason' => null,
                ]
            );

            $subTotal = 0.0;
            $discountTotal = 0.0;

            foreach ($data['items'] as $item) {
                $variant = ProductVariant::query()
                    ->whereHas('product', fn ($query) => $query->where('name', $item['product']))
                    ->when($item['size'] ?? null, fn ($query, $size) => $query->where('size', $size))
                    ->when($item['color'] ?? null, fn ($query, $color) => $query->where('color', $color))
                    ->first();

                if (!$variant) {
                    continue;
                }

                $quantity = (int) ($item['quantity'] ?? 1);
                $finalPrice = (float) $variant->price;

                OrderItem::updateOrCreate(
                    [
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                    ],
                    [
                        'order_id' => $order->id,
                        'product_variant_id' => $variant->id,
                        'price' => $variant->price,
                        'quantity' => $quantity,
                        'product_name' => $variant->product->name,
                        'variant_snapshot' => [
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'attributes' => $variant->attributes,
                            'sku' => $variant->sku,
                        ],
                        'original_price' => $variant->price,
                        'discount_amount' => 0,
                        'final_price' => $finalPrice,
                        'promotion_id' => null,
                        'promotion_snapshot' => null,
                    ]
                );

                $subTotal += (float) $variant->price * $quantity;
            }

            $shippingFee = $data['fulfillment_method'] === 'pickup' ? 0 : 35000;

            $order->update([
                'sub_total' => $subTotal,
                'discount_total' => $discountTotal,
                'grand_total' => $subTotal - $discountTotal,
                'shipping_fee' => $shippingFee,
                'total' => $subTotal - $discountTotal + $shippingFee,
            ]);

            Payment::updateOrCreate(
                [
                    'order_id' => $order->id,
                    'method' => $data['payment_method'],
                ],
                [
                    'status' => $data['payment_status'],
                    'amount' => $order->total,
                    'transaction_id' => $data['payment_method'] === 'mock_bank'
                        ? 'TXN-EVAL-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT)
                        : null,
                    'meta' => [
                        'source' => 'chatbot_evaluation_seeder',
                        'order_code' => $order->order_code,
                    ],
                    'response_data' => [
                        'gateway' => $data['payment_method'],
                        'result' => $data['payment_status'],
                    ],
                ]
            );

            OrderStatusHistory::firstOrCreate(
                [
                    'order_id' => $order->id,
                    'new_status' => $data['status'],
                ],
                [
                    'changed_by' => null,
                    'old_status' => $data['status'] === 'pending' ? null : 'pending',
                    'note' => 'Seed dữ liệu đánh giá chatbot',
                ]
            );
        }
    }

    private function seedApprovedAnswers(): void
    {
        if (!Schema::hasTable('chatbot_approved_answers')) {
            return;
        }

        $rows = [
            [
                'question' => 'Chính sách đổi trả như thế nào?',
                'answer' => "CTUT UniShop hỗ trợ đổi trả khi sản phẩm bị lỗi, giao sai mẫu hoặc sai kích thước theo thông tin đã xác nhận. Bạn nên liên hệ shop sớm sau khi nhận hàng và cung cấp mã đơn hàng để được hướng dẫn xử lý.",
            ],
            [
                'question' => 'Chính sách vận chuyển như thế nào?',
                'answer' => "CTUT UniShop có hai hình thức nhận hàng: giao tận nơi và nhận trực tiếp tại trường. Đơn giao tận nơi cần cung cấp đầy đủ thông tin người nhận, còn nhận tại trường thì bạn chỉ cần theo dõi trạng thái đơn và mang mã đơn hàng khi đến nhận.",
            ],
            [
                'question' => 'Hướng dẫn mua hàng',
                'answer' => "Bạn chọn sản phẩm, thêm vào giỏ, kiểm tra thông tin nhận hàng rồi xác nhận đặt đơn. Sau khi tạo đơn, bạn có thể theo dõi trạng thái trong hệ thống hoặc qua trang tra cứu đơn khách nếu chưa đăng nhập.",
            ],
        ];

        foreach ($rows as $row) {
            ChatbotApprovedAnswer::updateOrCreate(
                ['question_hash' => sha1(app(\App\Services\Chat\ChatbotQuestionNormalizer::class)->normalize($row['question']))],
                app(\App\Services\Chat\ChatbotApprovedAnswerService::class)->preparePayload([
                    'question' => $row['question'],
                    'answer' => $row['answer'],
                    'intent' => 'static_knowledge',
                    'status' => 'approved',
                    'is_active' => true,
                    'source_type' => 'seed',
                    'source_reference' => 'ChatbotEvaluationSeeder',
                ])
            );
        }
    }
}
