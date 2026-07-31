<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('fulfillment_method', ['delivery', 'pickup'])
                ->default('delivery')
                ->after('guest_phone');
            $table->enum('payment_status', ['unpaid', 'paid', 'failed', 'refunded'])
                ->default('unpaid')
                ->after('status');
        });

        DB::table('orders')
            ->where('status', 'paid')
            ->update(['status' => 'processing']);

        DB::table('orders')
            ->where('status', 'shipped')
            ->update(['status' => 'awaiting_receipt']);

        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM('pending', 'processing', 'awaiting_receipt', 'completed', 'cancelled')
            NOT NULL DEFAULT 'pending'
        ");

        DB::table('payments')
            ->where('method', 'mock')
            ->update(['method' => 'mock_bank']);

        DB::table('payments')
            ->whereIn('method', ['vnpay', 'momo', 'banking', 'baokim'])
            ->update(['method' => 'mock_bank']);

        DB::statement("
            ALTER TABLE payments
            MODIFY method ENUM('cod', 'mock_bank', 'cash_on_pickup')
            NOT NULL
        ");

        DB::table('payments')
            ->where('status', 'pending')
            ->update(['status' => 'unpaid']);

        DB::table('payments')
            ->where('status', 'success')
            ->update(['status' => 'paid']);

        DB::statement("
            ALTER TABLE payments
            MODIFY status ENUM('unpaid', 'paid', 'failed', 'refunded')
            NOT NULL DEFAULT 'unpaid'
        ");

        DB::table('orders')
            ->select('id')
            ->orderBy('id')
            ->chunk(100, function ($rows) {
                foreach ($rows as $row) {
                    $orderId = (int) $row->id;

                    $paymentStatuses = DB::table('payments')
                        ->where('order_id', $orderId)
                        ->orderByDesc('created_at')
                        ->pluck('status')
                        ->all();

                    $paymentStatus = 'unpaid';

                    if (in_array('paid', $paymentStatuses, true)) {
                        $paymentStatus = 'paid';
                    } elseif (in_array('refunded', $paymentStatuses, true)) {
                        $paymentStatus = 'refunded';
                    } elseif (in_array('failed', $paymentStatuses, true)) {
                        $paymentStatus = 'failed';
                    }

                    DB::table('orders')
                        ->where('id', $orderId)
                        ->update(['payment_status' => $paymentStatus]);
                }
            });

        DB::table('vat_invoice_requests')
            ->where('status', 'approved')
            ->update(['status' => 'processing']);

        DB::table('vat_invoice_requests')
            ->where('status', 'issued')
            ->update(['status' => 'fulfilled']);

        DB::statement("
            ALTER TABLE vat_invoice_requests
            MODIFY status ENUM('pending', 'processing', 'fulfilled', 'rejected')
            NOT NULL DEFAULT 'pending'
        ");

        Schema::table('vat_invoice_requests', function (Blueprint $table) {
            $table->foreignId('processed_by')
                ->nullable()
                ->after('admin_note')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('processed_at')->nullable()->after('processed_by');
            $table->timestamp('fulfilled_at')->nullable()->after('processed_at');
        });

        DB::table('vat_invoice_requests')
            ->where('status', 'fulfilled')
            ->update([
                'processed_at' => DB::raw('COALESCE(issued_at, updated_at)'),
                'fulfilled_at' => DB::raw('COALESCE(issued_at, updated_at)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('vat_invoice_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('processed_by');
            $table->dropColumn(['processed_at', 'fulfilled_at']);
        });

        DB::statement("
            ALTER TABLE vat_invoice_requests
            MODIFY status ENUM('pending', 'approved', 'issued', 'rejected')
            NOT NULL DEFAULT 'pending'
        ");

        DB::table('vat_invoice_requests')
            ->where('status', 'processing')
            ->update(['status' => 'approved']);

        DB::table('vat_invoice_requests')
            ->where('status', 'fulfilled')
            ->update(['status' => 'issued']);

        DB::statement("
            ALTER TABLE payments
            MODIFY status ENUM('pending', 'success', 'failed', 'refunded')
            NOT NULL DEFAULT 'pending'
        ");

        DB::table('payments')
            ->where('status', 'unpaid')
            ->update(['status' => 'pending']);

        DB::table('payments')
            ->where('status', 'paid')
            ->update(['status' => 'success']);

        DB::statement("
            ALTER TABLE payments
            MODIFY method ENUM('vnpay', 'momo', 'banking', 'baokim', 'mock', 'cod')
            NOT NULL
        ");

        DB::table('payments')
            ->where('method', 'mock_bank')
            ->update(['method' => 'mock']);

        DB::table('payments')
            ->where('method', 'cash_on_pickup')
            ->update(['method' => 'cod']);

        DB::statement("
            ALTER TABLE orders
            MODIFY status ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')
            NOT NULL DEFAULT 'pending'
        ");

        DB::table('orders')
            ->where('status', 'awaiting_receipt')
            ->update(['status' => 'shipped']);

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['fulfillment_method', 'payment_status']);
        });
    }
};
