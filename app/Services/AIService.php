<?php

namespace App\Services;

use App\Models\ChatHistory;
use App\Models\Product;

class AIService
{
    public function chat($user, string $question)
    {
        $answer = $this->generateAnswer(
            $user,
            $question
        );

        ChatHistory::create([

            'user_id' => $user->id,

            'question' => $question,

            'answer' => $answer,

            'source' => 'mock'
        ]);

        return [
            'question' => $question,
            'answer' => $answer,
            'source' => 'mock'
        ];
    }

    public function history($user)
    {
        return ChatHistory::query()
            ->where('user_id', $user->id)
            ->latest()
            ->paginate(20);
    }

    private function generateAnswer(
        $user,
        string $question
    )
    {
        $question = mb_strtolower($question);

        if (
            str_contains(
                $question,
                'áo'
            )
        ) {

            $product = Product::query()
                ->where(
                    'name',
                    'like',
                    '%áo%'
                )
                ->first();

            if ($product) {

                return
                "Sản phẩm phù hợp: {$product->name}";
            }
        }

        if (
            str_contains(
                $question,
                'đơn hàng'
            )
        ) {

            return
            "Bạn có thể xem đơn hàng tại My Orders.";
        }

        return
        "Xin lỗi, hiện chưa có dữ liệu phù hợp.";
    }
}