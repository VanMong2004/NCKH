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
                'Ly giữ nhiệt CTUT' => $this->tumbler($product),
                'Túi tote CTUT' => $this->tote($product),
                'Nón lưỡi trai CTUT' => $this->cap($product),
                'Móc khóa CTUT' => $this->keychain($product),
                'Sticker CTUT' => $this->sticker($product),
                'Bảng tên sinh viên CTUT' => $this->badge($product),
                'Dây đeo thẻ CTUT' => $this->lanyard($product),
                'Sổ tay CTUT' => $this->notebook($product),
                'Bút CTUT' => $this->pen($product),
                default => null,
            };
        }
    }

    private function upsertVariant(array $identity, array $values): void
    {
        ProductVariant::updateOrCreate($identity, $values);
    }

    private function clothing(Product $product, int $basePrice, array $colors): void
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
                    'price' => $basePrice + match ($size) {
                        'S' => 0,
                        'M' => 10000,
                        'L' => 20000,
                        'XL' => 30000,
                    },
                    'stock' => 60,
                    'reserved_stock' => 0,
                    'sold_stock' => 0,
                ]);
            }
        }
    }

    private function tumbler(Product $product): void
    {
        foreach ([['500ml', 169000], ['750ml', 199000], ['1000ml', 249000]] as [$capacity, $price]) {
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

    private function tote(Product $product): void
    {
        foreach ([['Canvas Standard', 89000], ['Canvas Premium', 129000]] as [$type, $price]) {
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

    private function cap(Product $product): void
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
                'price' => 119000,
                'stock' => 70,
                'reserved_stock' => 0,
                'sold_stock' => 0,
            ]);
        }
    }

    private function keychain(Product $product): void
    {
        foreach ([['Acrylic', 29000], ['Kim loại', 39000]] as [$material, $price]) {
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

    private function sticker(Product $product): void
    {
        foreach ([['Combo 10 sticker', 19000], ['Combo 20 sticker', 29000]] as [$package, $price]) {
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

    private function badge(Product $product): void
    {
        foreach ([['Sinh viên', 39000], ['Cán bộ', 49000]] as [$type, $price]) {
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

    private function lanyard(Product $product): void
    {
        foreach ([['Xanh CTUT', 25000], ['Đen', 25000]] as [$color, $price]) {
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

    private function notebook(Product $product): void
    {
        foreach ([['A5', 49000], ['B5', 69000]] as [$size, $price]) {
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

    private function pen(Product $product): void
    {
        foreach ([['Mực xanh', 12000], ['Mực đen', 12000]] as [$color, $price]) {
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
