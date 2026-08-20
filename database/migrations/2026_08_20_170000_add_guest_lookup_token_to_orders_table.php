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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('guest_lookup_token', 64)->nullable()->after('guest_token');
        });

        DB::table('orders')
            ->whereNull('user_id')
            ->whereNull('guest_lookup_token')
            ->orderBy('id')
            ->chunkById(100, function ($orders) {
                foreach ($orders as $order) {
                    DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'guest_lookup_token' => 'GLK-' . Str::upper(Str::random(10)),
                        ]);
                }
            });

        Schema::table('orders', function (Blueprint $table) {
            $table->unique('guest_lookup_token');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['guest_lookup_token']);
            $table->dropColumn('guest_lookup_token');
        });
    }
};
