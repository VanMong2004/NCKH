<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Services\OrderService;

class AutoCompleteOrder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // protected $signature = 'app:auto-complete-order';
    protected $signature = 'orders:auto-complete';

    /**
     * The console command description.
     *
     * @var string
     */
    // protected $description = 'Command description';
    protected $description = 'Auto complete orders after 3 days shipped';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $orders = Order::where('status', 'shipped')
            ->where('updated_at', '<=', now()->subDays(3))
            ->with('items.productVariant')
            ->get();

        foreach ($orders as $order) {

            try {
                app(OrderService::class)
                    ->confirmOrder($order, $order->user_id);

                $this->info("Order {$order->id} completed");

            } catch (\Exception $e) {

                $this->error("Order {$order->id} error: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }
}
