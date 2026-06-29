<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vat_invoice_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('order_code');
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();

            $table->string('company_name');
            $table->string('tax_code', 50);
            $table->text('company_address');
            $table->string('invoice_email')->nullable();

            $table->enum('status', [
                'pending',
                'approved',
                'issued',
                'rejected',
            ])->default('pending');

            $table->text('note')->nullable();
            $table->text('admin_note')->nullable();

            $table->timestamp('issued_at')->nullable();

            $table->timestamps();

            $table->unique('order_id');
            $table->index(['status', 'created_at']);
            $table->index('tax_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vat_invoice_requests');
    }
};
