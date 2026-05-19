<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AIService;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(
        protected AIService $aiService
    ){}

    public function chat(
        Request $request
    )
    {
        $data = $request->validate([

            'message' =>
            'required|string|max:2000'
        ]);

        return response()->json([

            'success' => true,

            'message' =>
            'AI phản hồi thành công',

            'data' => $this->aiService
                ->chat(
                    $request->user(),
                    $data['message']
                )
        ]);
    }

    public function history(
        Request $request
    )
    {
        $history = $this->aiService
            ->history(
                $request->user()
            );

        return response()->json([

            'success'=>true,

            'message'=>
            'Lấy lịch sử chat thành công',

            'data'=>
            $history->items(),

            'meta'=>[

                'current_page'=>
                $history->currentPage(),

                'last_page'=>
                $history->lastPage(),

                'per_page'=>
                $history->perPage(),

                'total'=>
                $history->total()
            ]
        ]);
    }
}