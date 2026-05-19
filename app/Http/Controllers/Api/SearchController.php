<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SearchService;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        protected SearchService $searchService
    ){}

    public function suggestions(Request $request)
    {
        $data = $request->validate([

            'keyword'=>
            'required|string'
        ]);

        return response()->json([

            'success'=>true,

            'message'=>
            'Gợi ý tìm kiếm',

            'data'=>
            $this->searchService
                ->suggestions(
                    $request->user(),
                    $data['keyword']
                )
        ]);
    }

    public function history(Request $request)
    {
        return response()->json([

            'success'=>true,

            'message'=>
            'Lịch sử tìm kiếm',

            'data'=>
            $this->searchService
                ->history(
                    $request->user()
                )
        ]);
    }

    public function deleteHistory(
        Request $request,
        $id
    ){
        $this->searchService
            ->deleteHistory(
                $request->user(),
                $id
            );

        return response()->json([

            'success'=>true,

            'message'=>
            'Đã xóa lịch sử'
        ]);
    }

    public function clearHistory(
        Request $request
    ){

        $this->searchService
            ->clearHistory(
                $request->user()
            );

        return response()->json([

            'success'=>true,

            'message'=>
            'Đã xóa toàn bộ lịch sử'
        ]);
    }
}