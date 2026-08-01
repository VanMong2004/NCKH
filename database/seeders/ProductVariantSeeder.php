<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductVariantSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Product::with('category')->get() as $product) {
            match ($product->name) {
                'Áo thun CTUT K2026' => $this->clothing($product, 149000, ['Trắng', 'Xanh CTUT', 'Đen']),
                'Áo khoa CNTT' => $this->clothing($product, 159000, ['Đen', 'Xanh CTUT']),
                'Áo khoa Cơ khí' => $this->clothing($product, 159000, ['Đen', 'Xám']),
                'Áo khoa Điện - Điện tử' => $this->clothing($product, 159000, ['Trắng', 'Xanh Navy']),
                'Áo Freshman Week 2026' => $this->clothing($product, 139000, ['Trắng', 'Cam', 'Xanh CTUT']),
                'Hoodie CTUT Premium' => $this->clothing($product, 349000, ['Đen', 'Xám']),
                'Ly giữ nhiệt CTUT' => $this->tumbler($product, 199000),
                'Túi tote CTUT' => $this->tote($product, 89000),
                'Nón lưỡi trai CTUT' => $this->cap($product, 119000),
                'Móc khóa CTUT' => $this->keychain($product, 29000),
                'Sticker CTUT' => $this->sticker($product, 19000),
                'Bảng tên sinh viên CTUT' => $this->badge($product, 39000),
                'Dây đeo thẻ CTUT' => $this->lanyard($product, 25000),
                'Sổ tay CTUT' => $this->notebook($product, 69000),
                'Bút CTUT' => $this->pen($product, 12000),
                default => null,
            };
        }
    }

    private function upsertVariant(array $identity, array $values): void
    {
        ProductVariant::updateOrCreate($identity, $values);
    }

    private function clothing(Product $product, int $price, array $colors): void
    {
        foreach ($colors as $color) {
            foreach (['S', 'M', 'L', 'XL'] as $size) {
                $sku = sprintf('CTUT-%d-%s-%s', $product->id, $size, Str::upper(Str::slug($color)));

                $this->upsertVariant([
                    'sku' => $sku,
                ], [
                    'product_id' => $product->id,
                    'size' => $size,
                    'color' => $color,
                    'attributes' => ['material' => 'Cotton 65/35'],
                    'sku' => $sku,
                    'price' => $price,
                    'stock' => 60,
                    'reserved_stock' => 0,
                    'sold_stock' => 0,
                ]);
            }
        }
    }

    private function tumbler(Product $product, int $price): void
    {
        foreach (['500ml', '750ml', '1000ml'] as $capacity) {
            $sku = 'CTUT-TUMBLER-' . str_replace('ml', '', $capacity);

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'attributes' => ['capacity' => $capacity, 'material' => 'Inox 304'],
                'sku' => $sku,
                'price' => $price,
                'stock' => 80,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function tote(Product $product, int $price): void
    {
        foreach (['Canvas Standard', 'Canvas Premium'] as $type) {
            $sku = 'CTUT-TOTE-' . Str::upper(Str::slug($type));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'attributes' => ['material' => $type],
                'sku' => $sku,
                'price' => $price,
                'stock' => 100,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function cap(Product $product, int $price): void
    {
        foreach (['Đen', 'Xanh Navy', 'Trắng'] as $color) {
            $sku = 'CTUT-CAP-' . Str::upper(Str::slug($color));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'color' => $color,
                'attributes' => ['adjustable' => true],
                'sku' => $sku,
                'price' => $price,
                'stock' => 70,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function keychain(Product $product, int $price): void
    {
        foreach (['Acrylic', 'Kim loại'] as $material) {
            $sku = 'CTUT-KEY-' . Str::upper(Str::slug($material));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'attributes' => ['material' => $material],
                'sku' => $sku,
                'price' => $price,
                'stock' => 200,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function sticker(Product $product, int $price): void
    {
        foreach (['Combo 10 sticker', 'Combo 20 sticker'] as $package) {
            $sku = 'CTUT-STICKER-' . Str::upper(Str::slug($package));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'attributes' => ['package' => $package],
                'sku' => $sku,
                'price' => $price,
                'stock' => 300,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function badge(Product $product, int $price): void
    {
        foreach (['Sinh viên', 'Cán bộ'] as $type) {
            $sku = 'CTUT-ID-' . Str::upper(Str::slug($type));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'attributes' => ['type' => $type],
                'sku' => $sku,
                'price' => $price,
                'stock' => 500,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function lanyard(Product $product, int $price): void
    {
        foreach (['Xanh CTUT', 'Đen'] as $color) {
            $sku = 'CTUT-LANYARD-' . Str::upper(Str::slug($color));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'color' => $color,
                'attributes' => ['material' => 'Polyester'],
                'sku' => $sku,
                'price' => $price,
                'stock' => 250,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function notebook(Product $product, int $price): void
    {
        foreach (['A5', 'B5'] as $size) {
            $sku = 'CTUT-NOTEBOOK-' . $size;

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'size' => $size,
                'attributes' => ['pages' => 120],
                'sku' => $sku,
                'price' => $price,
                'stock' => 120,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function pen(Product $product, int $price): void
    {
        foreach (['Mực xanh', 'Mực đen'] as $color) {
            $sku = 'CTUT-PEN-' . Str::upper(Str::slug($color));

            $this->upsertVariant([
                'sku' => $sku,
            ], [
                'product_id' => $product->id,
                'color' => $color,
                'attributes' => ['type' => 'Bút bi'],
                'sku' => $sku,
                'price' => $price,
                'stock' => 500,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }
}
