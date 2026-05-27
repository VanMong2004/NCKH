<?php

namespace App\Services\Gateways;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use App\Events\OrderPaid;

class MockPaymentGatewayService
{
    public function create(Payment $payment)
    {
        // giả lập trả URL
        return [
            'payment_id' => $payment->id,
            'transaction_id' => $payment->transaction_id,
            'redirect_url' => url("/api/payment/callback?payment_id={$payment->id}&status=success&method=mock")
        ];
    }

    public function callback(array $data)
    {
        return DB::transaction(function () use ($data) {

            $payment = Payment::lockForUpdate()->findOrFail($data['payment_id']);

            // 🔥 chống double callback
            if ($payment->status === 'success') {
                return [
                    'message' => 'Payment đã xử lý',
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'status' => 'success',
                ];
            }

            $order = Order::lockForUpdate()->findOrFail($payment->order_id);

            $status = $data['status'] === 'success' ? 'success' : 'failed';

            $payment->update([
                'status' => $status,
                'response_data' => $data
            ]);

            if ($status === 'success') {

                $order->update([
                    'status' => 'paid'
                ]);

                // 🔥 FIRE EVENT
                $order->load('items.productVariant');
                event(new OrderPaid($order));
            } else {

                foreach ($order->items as $item) {

                    if (
                        $order->type === 'campaign'
                        && $item->campaign_item_id
                    ) {

                        $userCampaignItem =
                            \App\Models\UserCampaignItem::where(
                                'campaign_item_id',
                                $item->campaign_item_id
                            )
                            ->whereHas('userCampaign', function ($q) use ($order) {

                                $q->where('user_id', $order->user_id);
                            })
                            ->first();

                        if ($userCampaignItem) {

                            $userCampaignItem->decrement(
                                'reserved_quantity',
                                $item->quantity
                            );
                        }
                    }
                }
            }

            return [
                'message' => 'Callback xử lý thành công',
                'payment_id' => $payment->id,
                'order_id' => $order->id,
                'status' => $status,
            ];
        });
    }
}