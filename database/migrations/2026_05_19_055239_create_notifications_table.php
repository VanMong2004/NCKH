<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // order | campaign | payment | system
            $table->enum('type', [
                'order',
                'campaign',
                'payment',
                'system'
            ]);

            $table->string('title');

            $table->text('message');

            // link FE
            $table->string('action_url')
                ->nullable();

            // dữ liệu phụ
            $table->json('meta')
                ->nullable();

            $table->boolean('is_read')
                ->default(false);

            $table->timestamp('read_at')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
