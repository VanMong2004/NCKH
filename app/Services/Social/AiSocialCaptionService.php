<?php

namespace App\Services\Social;

use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class AiSocialCaptionService
{
    private const STYLES = [
        'intro' => 'gioi thieu san pham moi, tu nhien, ro rang',
        'promotion' => 'nhan manh uu dai va gia tri mua hang',
        'sales' => 'ban hang thuyet phuc, co loi keu goi hanh dong',
    ];

    public function generateProductCaption(Product $product, string $style = 'intro'): array
    {
        $style = array_key_exists($style, self::STYLES) ? $style : 'intro';

        $product->loadMissing(['category', 'variants']);

        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        $prompt = $this->buildPrompt($product, $style);
        $payload = [
            'model' => config('services.openai.chat_model'),
            'input' => [
                [
                    'role' => 'system',
                    'content' => 'Bạn là trợ lý viết nội dung Facebook cho CTUT Store. Chỉ tạo nội dung bài đăng, không tự thay đổi tên sản phẩm, giá, liên kết, chương trình khuyến mãi hoặc thông tin quan trọng. Viết bằng tiếng Việt, tự nhiên, đúng sự thật, không bịa khuyến mãi.',
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
            'temperature' => 0.7,
            'max_output_tokens' => 450,
        ];

        try {
            $baseUrl = rtrim(config('services.openai.base_url'), '/');
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(45)
                ->post($baseUrl . '/responses', $payload);
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể kết nối OpenAI API: ' . $e->getMessage(), 500);
        }

        if (!$response->successful()) {
            throw new RuntimeException('OpenAI API trả lỗi: ' . $response->body(), 500);
        }

        $content = trim($this->extractText($response->json()));

        if ($content === '') {
            throw new RuntimeException('OpenAI không trả về nội dung bài đăng', 500);
        }

        return [
            'style' => $style,
            'content' => $content,
        ];
    }

    public function generatePromotionCaption(Promotion $promotion, string $style = 'promotion'): array
    {
        $style = array_key_exists($style, self::STYLES) ? $style : 'promotion';

        $promotion->loadMissing(['items.product', 'items.productVariant']);

        $apiKey = config('services.openai.api_key');

        if (!$apiKey) {
            throw new RuntimeException('Chưa cấu hình OPENAI_API_KEY', 500);
        }

        $payload = [
            'model' => config('services.openai.chat_model'),
            'input' => [
                [
                    'role' => 'system',
                    'content' => 'Bạn là trợ lý viết nội dung Facebook cho CTUT Store. Chỉ tạo nội dung bài đăng, không tự thay đổi tên khuyến mãi, mức giảm, thời gian, liên kết hoặc thông tin quan trọng. Viết bằng tiếng Việt, tự nhiên, đúng sự thật, không bịa ưu đãi.',
                ],
                [
                    'role' => 'user',
                    'content' => $this->buildPromotionPrompt($promotion, $style),
                ],
            ],
            'temperature' => 0.7,
            'max_output_tokens' => 500,
        ];

        try {
            $baseUrl = rtrim(config('services.openai.base_url'), '/');
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->timeout(45)
                ->post($baseUrl . '/responses', $payload);
        } catch (Throwable $e) {
            throw new RuntimeException('Không thể kết nối OpenAI API: ' . $e->getMessage(), 500);
        }

        if (!$response->successful()) {
            throw new RuntimeException('OpenAI API trả lỗi: ' . $response->body(), 500);
        }

        $content = trim($this->extractText($response->json()));

        if ($content === '') {
            throw new RuntimeException('OpenAI không trả về nội dung bài đăng', 500);
        }

        return [
            'style' => $style,
            'content' => $content,
        ];
    }

    private function buildPrompt(Product $product, string $style): string
    {
        $productUrl = app(N8nSocialAutomationService::class)->publicProductUrl($product);
        $prices = $product->variants
            ->pluck('price')
            ->filter(fn ($price) => $price !== null)
            ->map(fn ($price) => (float) $price);

        $minPrice = $prices->min();
        $maxPrice = $prices->max();
        $priceText = $minPrice && $maxPrice
            ? ($minPrice === $maxPrice ? number_format($minPrice, 0, ',', '.') . 'đ' : number_format($minPrice, 0, ',', '.') . 'đ - ' . number_format($maxPrice, 0, ',', '.') . 'đ')
            : 'Chưa có giá';

        $variants = $product->variants
            ->take(6)
            ->map(fn ($variant) => trim(implode(' ', array_filter([$variant->size, $variant->color, $variant->sku]))))
            ->filter()
            ->values()
            ->implode(', ');

        return implode("\n", [
            'Hãy viết 1 bài đăng Facebook cho sản phẩm sau.',
            'Phong cách: ' . self::STYLES[$style],
            'Tên sản phẩm: ' . $product->name,
            'Danh mục: ' . ($product->category?->name ?? 'Không xác định'),
            'Giá bán: ' . $priceText,
            'Mô tả ngắn: ' . ($product->short_description ?: 'Không có'),
            'Mô tả: ' . mb_substr(strip_tags((string) $product->description), 0, 700),
            'Biến thể: ' . ($variants ?: 'Không có thông tin biến thể'),
            'Liên kết: ' . $productUrl,
            'Yêu cầu định dạng:',
            '- 3 đến 6 dòng ngắn, dễ đọc.',
            '- Có lời kêu gọi hành động vừa phải.',
            '- Có hashtag #CTUTStore #CTUT.',
            '- Nếu nhắc đến liên kết, phải dùng đúng URL ở trên, không viết placeholder như [link sản phẩm].',
            '- Không tự tạo mã giảm giá, không đổi giá, không bịa thông tin.',
        ]);
    }

    private function buildPromotionPrompt(Promotion $promotion, string $style): string
    {
        $promotionUrl = app(N8nSocialAutomationService::class)->publicPromotionUrl($promotion);
        $discountText = $promotion->discount_type === 'percent'
            ? 'Giảm ' . number_format((float) $promotion->discount_value, 0, ',', '.') . '%'
            : 'Giảm ' . number_format((float) $promotion->discount_value, 0, ',', '.') . 'đ';

        $products = $promotion->items
            ->take(6)
            ->map(function ($item) {
                $product = $item->product;
                $variant = $item->productVariant;

                if (!$product) {
                    return null;
                }

                $variantText = $variant
                    ? trim(implode(' ', array_filter([$variant->size, $variant->color])))
                    : '';

                return $variantText ? $product->name . ' (' . $variantText . ')' : $product->name;
            })
            ->filter()
            ->values()
            ->implode(', ');

        return implode("\n", [
            'Hãy viết 1 bài đăng Facebook cho đợt khuyến mãi sau.',
            'Phong cách: ' . self::STYLES[$style],
            'Tên khuyến mãi: ' . $promotion->title,
            'Mức ưu đãi: ' . $discountText,
            'Thời gian: ' . optional($promotion->start_date)->format('d/m/Y H:i') . ' - ' . optional($promotion->end_date)->format('d/m/Y H:i'),
            'Mô tả: ' . mb_substr(strip_tags((string) $promotion->description), 0, 700),
            'Sản phẩm nổi bật: ' . ($products ?: 'Không có'),
            'Số sản phẩm áp dụng: ' . $promotion->items->count(),
            'Liên kết: ' . $promotionUrl,
            'Yêu cầu định dạng:',
            '- 3 đến 7 dòng ngắn, dễ đọc.',
            '- Có lời kêu gọi hành động vừa phải.',
            '- Có hashtag #CTUTStore #CTUT #KhuyenMai.',
            '- Nếu nhắc đến liên kết, phải dùng đúng URL ở trên, không viết placeholder.',
            '- Không tự tạo mã giảm giá, không đổi mức giảm, không bịa thông tin.',
        ]);
    }

    private function extractText(array $data): string
    {
        if (!empty($data['output_text'])) {
            return (string) $data['output_text'];
        }

        $parts = [];

        foreach ($data['output'] ?? [] as $output) {
            foreach ($output['content'] ?? [] as $content) {
                if (($content['type'] ?? null) === 'output_text' && isset($content['text'])) {
                    $parts[] = $content['text'];
                }
            }
        }

        return implode("\n", $parts);
    }
}
