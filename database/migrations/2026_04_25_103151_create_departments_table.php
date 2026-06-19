<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code', 50)->nullable()->unique();

            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        $departments = [
            ['name' => 'Khoa Công nghệ thông tin', 'code' => 'CNTT', 'sort_order' => 1],
            ['name' => 'Khoa Công nghệ thực phẩm và Công nghệ sinh học', 'code' => 'CNTP-CNSH', 'sort_order' => 2],
            ['name' => 'Khoa Cơ khí', 'code' => 'CK', 'sort_order' => 3],
            ['name' => 'Khoa Điện - Điện tử - Viễn thông', 'code' => 'DDT-VT', 'sort_order' => 4],
            ['name' => 'Khoa Xây dựng', 'code' => 'XD', 'sort_order' => 5],
            ['name' => 'Khoa Quản lý công nghiệp', 'code' => 'QLCN', 'sort_order' => 6],
            ['name' => 'Khoa Khoa học cơ bản', 'code' => 'KHCB', 'sort_order' => 7],
        ];

        foreach ($departments as $department) {
            DB::table('departments')->insert([
                'name' => $department['name'],
                'slug' => Str::slug($department['name']),
                'code' => $department['code'],
                'is_active' => true,
                'sort_order' => $department['sort_order'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Tránh lỗi khi products.department_id đang có dữ liệu không tồn tại trong departments
        DB::table('products')
            ->whereNotNull('department_id')
            ->whereNotIn('department_id', DB::table('departments')->pluck('id'))
            ->update(['department_id' => null]);

        Schema::table('products', function (Blueprint $table) {
            $table->foreign('department_id')
                ->references('id')
                ->on('departments')
                ->nullOnDelete()
                ->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
        });

        Schema::dropIfExists('departments');
    }
};