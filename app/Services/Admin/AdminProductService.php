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
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Jobs\SendProductSocialAutomationJob;
use App\Services\Social\N8nSocialAutomationService;

class AdminProductService
{
    // LẤY DANH SÁCH SẢN PHẨM
    public function index($request)
    {
        $query = Product::query()
            ->with([
                'category',
                'images',
                'variants',
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

        $perPage = $request->per_page ?? 10;

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

                'category'
                    => $product->category?->name,

                'thumbnail'
                    => optional(
                        $product->images
                            ->where('type', 'thumbnail')
                            ->first()
                    )->url,

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

            $socialLog = app(N8nSocialAutomationService::class)
                ->createProductCreatedLog($product);

            SendProductSocialAutomationJob::dispatch($socialLog->id)->afterCommit();

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

        validator($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'nullable|integer',
            'author' => 'nullable|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'is_active' => 'required|boolean',
            'is_featured' => 'required|boolean',

            'images' => 'nullable|array|min:1|max:10',
            'images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            
            'variants' => 'nullable|array|min:1',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.sku' => 'nullable|string|max:100',
            'variants.*.attributes' => 'nullable|array',
            'variants.*.size' => 'nullable|string|max:50',
            'variants.*.color' => 'nullable|string|max:50',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.stock' => 'nullable|integer|min:0',
            
        ])->validate();

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
}