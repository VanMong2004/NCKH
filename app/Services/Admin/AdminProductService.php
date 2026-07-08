<?php

namespace App\Services\Admin;

use Exception;
use App\Models\Product;
use App\Models\Category;
use App\Models\OrderItem;
use Illuminate\Support\Str;
use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Jobs\SendProductSocialAutomationJob;
use App\Services\Social\AiSocialCaptionService;
use App\Services\Social\N8nSocialAutomationService;

class AdminProductService
{
    // LẤY DANH SÁCH SẢN PHẨM
    public function index($request)
    {
        $query = Product::query()
            ->with([
                'category:id,name',
                'department:id,name,code',
                'thumbnailImage:id,product_id,url,type,position',
                'primaryImage:id,product_id,url,type,position',
                'variants:id,product_id,price,stock,is_active',
            ]);

        if ($request->filled('keyword')) {

            $query->where(function ($q) use ($request) {

                $q->where(
                    'name',
                    'like',
                    '%' . $request->keyword . '%'
                )

                ->orWhere(
                    'slug',
                    'like',
                    '%' . $request->keyword . '%'
                );
            });
        }

        if ($request->filled('category_id')) {

            $query->where(
                'category_id',
                $request->category_id
            );
        }

        if ($request->has('is_active')) {

            $query->where(
                'is_active',
                $request->is_active
            );
        }

        if ($request->has('is_featured')) {

            $query->where(
                'is_featured',
                $request->is_featured
            );
        }

        switch ($request->sort_by) {

            case 'oldest':

                $query->oldest();

                break;

            case 'name_asc':

                $query->orderBy('name');

                break;

            case 'name_desc':

                $query->orderByDesc('name');

                break;

            default:

                $query->latest();
        }

        $perPage = min((int) ($request->per_page ?? 10), 50);

        $products = $query
            ->paginate($perPage);

        $productCollection = collect(
            $products->items()
        )->map(

            fn($product) => [

                'id'
                    => $product->id,

                'name'
                    => $product->name,

                'slug'
                    => $product->slug,

                'department' => $product->department ? [
                        'id' => $product->department->id,
                        'name' => $product->department->name,
                        'code' => $product->department->code,
                    ] : null,

                'category'
                    => $product->category?->name,

                'thumbnail'
                    => $product->thumbnailImage?->url
                        ?? $product->primaryImage?->url,

                'variants_count'
                    => $product->variants->count(),

                'min_price'
                    => $product->variants->min('price'),

                'max_price'
                    => $product->variants->max('price'),

                'total_stock'
                    => $product->variants->sum('stock'),

                'sold_count'
                    => $product->sold_count,

                'average_rating'
                    => $product->average_rating,

                'total_reviews'
                    => $product->total_reviews,

                'is_active'
                    => $product->is_active,

                'active_variants_count' 
                    => $product->variants->where('is_active', true)->count(),

                'inactive_variants_count' 
                    => $product->variants->where('is_active', false)->count(),

                'is_featured'
                    => $product->is_featured,

                'created_at'
                    => $product->created_at,
            ]
        );

        $products->setCollection(
            $productCollection
        );

        return [

            'success' => true,

            'message'
                => 'Lấy danh sách sản phẩm thành công',

            'data'
                => $products,
        ];
    }

    // LẤY CHI TIẾT SẢN PHẨM
    public function show($id)
    {
        $product = Product::query()
            ->with([
                'category',
                'department',
                'images',
                'variants',
            ])
            ->findOrFail($id);

        return [

            'success' => true,

            'message'
                => 'Lấy chi tiết sản phẩm thành công',

            'data' => $product,
        ];
    }

    // TẠO SẢN PHẨM MỚI
    public function store($request)
    {           
        return DB::transaction(function () use ($request) {

            $product = Product::create([

                'name'
                    => $request->name,

                'slug'
                    => Str::slug($request->name),

                'category_id'
                    => $request->category_id,

                'description'
                    => $request->description,

                'department_id' 
                    => $request->department_id,
                
                'author' 
                    => $request->author,

                'is_active'
                    => $request->is_active,

                'is_featured'
                    => $request->is_featured,

                'average_rating'
                    => 0,

                'total_reviews'
                    => 0,
            ]);

            $this->uploadImages(
                $product,
                $request->file('images')
            );

            $this->syncVariants(
                $product,
                $request->variants
            );

            $this->clearProductFilterCache();

            return [

                'success' => true,

                'message'
                    => 'Tạo sản phẩm thành công',

                'data'
                    => $this->show($product->id)['data'],
            ];
        });
    }

    // CẬP NHẬT SẢN PHẨM
    public function update($request, $id)
    {
        $product = Product::findOrFail($id);

        return DB::transaction(function () use (
            $request,
            $product
        ) {

            $product->update([

                'name'
                    => $request->name,

                'slug'
                    => Str::slug($request->name),

                'category_id'
                    => $request->category_id,

                'description'
                    => $request->description,

                'department_id'
                    => $request->department_id,

                'author'
                    => $request->author,

                'is_active'
                    => $request->is_active,

                'is_featured'
                    => $request->is_featured,
            ]);

            if ($request->hasFile('images')) {

                $this->replaceImages(
                    $product,
                    $request->file('images')
                );
            }

            if ($request->filled('variants')) {
                $this->syncVariantsForUpdate(
                    $product,
                    $request->variants
                );
            }

            $this->clearProductFilterCache();

            return [

                'success' => true,

                'message'
                    => 'Cập nhật sản phẩm thành công',

                'data'
                    => $this->show($product->id)['data'],
            ];
        });
    }

    // XÓA SẢN PHẨM
    public function destroy($id)
    {
        $product = Product::findOrFail($id);

        $hasActiveOrders = OrderItem::query()
            ->whereHas('productVariant', function ($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->whereHas('order', function ($q) {
                $q->whereIn('status', [
                    'pending',
                    'paid',
                    'processing',
                    'shipped',
                ]);
            })
            ->exists();

        if ($hasActiveOrders) {
            throw new Exception(
                'Sản phẩm đang có đơn hàng chưa hoàn tất, không thể xóa'
            );
        }

        $product->delete();

        $this->clearProductFilterCache();

        return [

            'success' => true,

            'message'
                => 'Xóa sản phẩm thành công',

            'data'
                => null,
        ];
    }

    // IMAGE UPLOADING
    private function uploadImages($product, $images)
    {
        /*
        |--------------------------------------------------------------------------
        | FOLDER
        |--------------------------------------------------------------------------
        */

        $folderName = Str::slug($product->name);

        $folderPath = public_path(
            'images/products/' . $folderName
        );

        if (!File::exists($folderPath)) {

            File::makeDirectory(
                $folderPath,
                0755,
                true
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SAVE IMAGES
        |--------------------------------------------------------------------------
        */

        foreach ($images as $index => $image) {

            /*
            |--------------------------------------------------------------------------
            | GENERATE FILE NAME
            |--------------------------------------------------------------------------
            */

            $originalName = pathinfo(
                $image->getClientOriginalName(),
                PATHINFO_FILENAME
            );

            $extension = $image->getClientOriginalExtension();

            $fileName =
                Str::slug($originalName)
                . '-'
                . uniqid()
                . '.'
                . $extension;

            /*
            |--------------------------------------------------------------------------
            | MOVE IMAGE
            |--------------------------------------------------------------------------
            */

            $image->move(
                $folderPath,
                $fileName
            );

            /*
            |--------------------------------------------------------------------------
            | SAVE DATABASE
            |--------------------------------------------------------------------------
            */

            $relativePath =
                'images/products/'
                . $folderName
                . '/'
                . $fileName;

            ProductImage::create([

                'product_id'
                    => $product->id,

                'url'
                    => url($relativePath),

                'type'
                    => $index === 0
                        ? 'thumbnail'
                        : 'gallery',

                'position'
                    => $index + 1,
            ]);
        }
    }

    // VARIANT MANAGEMENT
    private function syncVariants($product, $variants)
    {
        foreach ($variants as $variant) {

            if (!is_array($variant)) {
                continue;
            }

            $this->ensureSkuAvailable($variant['sku'] ?? null);

            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variant['size'] ?? null,
                'color' => $variant['color'] ?? null,
                'attributes' => $variant['attributes'] ?? [],
                'sku' => $variant['sku'] ?? $this->generateSku(),
                'price' => $variant['price'] ?? 0,
                'stock' => $variant['stock'] ?? 0,
                'reserved_stock' => 0,
                'sold_stock' => 0,
                'is_active' => $variant['is_active'] ?? true,
            ]);
        }
    }

    private function generateSku()
    {
        return strtoupper(
            Str::random(12)
        );
    }

    // REPLACE IMAGES & VARIANTS
    private function replaceImages($product, $images)
    {
        /*
        |--------------------------------------------------------------------------
        | DELETE OLD FILES
        |--------------------------------------------------------------------------
        */

        foreach ($product->images as $image) {

            $imagePath = str_replace(
                url('/'),
                '',
                $image->url
            );

            $fullPath = public_path($imagePath);

            if (File::exists($fullPath)) {

                File::delete($fullPath);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE OLD DB
        |--------------------------------------------------------------------------
        */

        ProductImage::where(
            'product_id',
            $product->id
        )->delete();

        /*
        |--------------------------------------------------------------------------
        | UPLOAD NEW
        |--------------------------------------------------------------------------
        */

        $this->uploadImages(
            $product,
            $images
        );
    }

    private function syncVariantsForUpdate($product, $variants)
    {
        foreach ($variants as $variantData) {
            if (!is_array($variantData)) {
                continue;
            }

            if (!empty($variantData['id'])) {
                $variant = ProductVariant::where('product_id', $product->id)
                    ->where('id', $variantData['id'])
                    ->first();

                if (!$variant) {
                    throw new Exception('Biến thể sản phẩm không tồn tại');
                }

                $newStock = array_key_exists('stock', $variantData)
                    ? (int) $variantData['stock']
                    : (int) $variant->stock;

                if ($newStock < $variant->reserved_stock) {
                    throw new Exception('Tồn kho mới không được nhỏ hơn số lượng đang giữ chỗ');
                }

                if ($newStock < $variant->sold_stock) {
                    throw new Exception('Tồn kho mới không được nhỏ hơn số lượng đã bán');
                }

                $this->ensureSkuAvailable(
                    $variantData['sku'] ?? null,
                    $variant->id
                );

                $before = clone $variant;

                $variant->update([
                    'size' => array_key_exists('size', $variantData)
                        ? $variantData['size']
                        : $variant->size,
                    'color' => array_key_exists('color', $variantData)
                        ? $variantData['color']
                        : $variant->color,
                    'attributes' => array_key_exists('attributes', $variantData)
                        ? $variantData['attributes']
                        : $variant->attributes,
                    'sku' => $variantData['sku'] ?? $variant->sku,
                    'price' => $variantData['price'] ?? $variant->price,
                    'stock' => $newStock,
                    'is_active' => array_key_exists('is_active', $variantData)
                        ? (bool) $variantData['is_active']
                        : $variant->is_active,
                ]);

                $after = $variant->fresh();

                if ((int) $before->stock !== (int) $after->stock) {
                    app(\App\Services\Admin\InventoryHistoryService::class)->record(
                        $before,
                        $after,
                        'admin_adjust',
                        abs((int) $after->stock - (int) $before->stock),
                        null,
                        auth()->id(),
                        'Admin cập nhật tồn kho sản phẩm'
                    );
                }

                continue;
            }

            $this->ensureSkuAvailable($variantData['sku'] ?? null);

            ProductVariant::create([
                'product_id' => $product->id,
                'size' => $variantData['size'] ?? null,
                'color' => $variantData['color'] ?? null,
                'attributes' => $variantData['attributes'] ?? [],
                'sku' => $variantData['sku'] ?? $this->generateSku(),
                'price' => $variantData['price'] ?? 0,
                'stock' => $variantData['stock'] ?? 0,
                'reserved_stock' => 0,
                'sold_stock' => 0,
                'is_active' => $variantData['is_active'] ?? true,
            ]);
        }
    }

    private function ensureSkuAvailable(?string $sku, ?int $ignoreVariantId = null): void
    {
        if (!$sku) {
            return;
        }

        $exists = ProductVariant::query()
            ->where('sku', $sku)
            ->when($ignoreVariantId, function ($q) use ($ignoreVariantId) {
                $q->where('id', '!=', $ignoreVariantId);
            })
            ->exists();

        if ($exists) {
            throw new Exception("SKU {$sku} đã tồn tại");
        }
    }

    public function toggleProductSale($id, bool $isActive): array
    {
        $product = Product::findOrFail($id);

        $product->update([
            'is_active' => $isActive,
        ]);

        if (!$isActive) {
            ProductVariant::where('product_id', $product->id)
                ->update([
                    'is_active' => false,
                ]);
        }

        $this->clearProductFilterCache();

        return [
            'success' => true,
            'message' => $isActive
                ? 'Đã mở bán sản phẩm'
                : 'Đã tắt bán sản phẩm',
            'data' => $this->show($product->id)['data'],
        ];
    }

    public function toggleVariantSale($id, bool $isActive): array
    {
        $variant = ProductVariant::with('product')->findOrFail($id);

        if ($isActive && !$variant->product->is_active) {
            throw new Exception('Không thể mở bán biến thể khi sản phẩm đang bị tắt bán');
        }

        $variant->update([
            'is_active' => $isActive,
        ]);

        $this->clearProductFilterCache();

        return [
            'success' => true,
            'message' => $isActive
                ? 'Đã mở bán biến thể sản phẩm'
                : 'Đã tắt bán biến thể sản phẩm',
            'data' => $variant->fresh(),
        ];
    }

    public function generateFacebookCaption($id, string $style = 'intro'): array
    {
        $product = Product::with([
            'category',
            'variants',
        ])->findOrFail($id);

        $this->ensureProductCanPostFacebook($product, true);

        if (!$product->is_active) {
            throw new Exception('Không thể tạo nội dung Facebook vì sản phẩm đang tắt bán');
        }

        $caption = app(AiSocialCaptionService::class)
            ->generateProductCaption($product, $style);

        return [
            'success' => true,
            'message' => 'Đã tạo nội dung bài đăng bằng AI',
            'data' => $caption,
        ];
    }

    public function postFacebook($id, array $data = []): array
    {
        $product = Product::with([
            'category',
            'images',
            'variants',
        ])->findOrFail($id);

        $this->ensureProductCanPostFacebook($product);

        if (!$product->is_active) {
            throw new Exception('Không thể đăng Facebook vì sản phẩm đang tắt bán');
        }

        $hasActiveVariant = $product->variants
            ->where('is_active', true)
            ->isNotEmpty();

        if (!$hasActiveVariant) {
            throw new Exception('Không thể đăng Facebook vì sản phẩm không có biến thể đang mở bán');
        }

        $caption = trim((string) ($data['content'] ?? ''));
        $style = $data['style'] ?? null;

        $socialLog = app(N8nSocialAutomationService::class)
            ->createProductCreatedLog($product, $caption !== '' ? $caption : null, $style);

        SendProductSocialAutomationJob::dispatch($socialLog->id);

        return [
            'success' => true,
            'message' => 'Đã gửi yêu cầu đăng Facebook sang n8n',
            'data' => [
                'log_id' => $socialLog->id,
                'status' => $socialLog->status,
            ],
        ];
    }

    private function ensureProductCanPostFacebook(Product $product, bool $forCaption = false): void
    {
        if (!$product->is_active) {
            throw new Exception($forCaption
                ? 'Không thể tạo nội dung Facebook vì sản phẩm đang tắt bán'
                : 'Không thể đăng Facebook vì sản phẩm đang tắt bán');
        }

        $hasActiveVariant = $product->variants
            ->where('is_active', true)
            ->isNotEmpty();

        if (!$hasActiveVariant) {
            throw new Exception($forCaption
                ? 'Không thể tạo nội dung Facebook vì sản phẩm không có biến thể đang mở bán'
                : 'Không thể đăng Facebook vì sản phẩm không có biến thể đang mở bán');
        }
    }

    private function clearProductFilterCache(): void
    {
        Cache::forget('products:filter_meta:v1');
    }
}
