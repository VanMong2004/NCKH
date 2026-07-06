<?php

namespace Database\Seeders;

use App\Models\SearchHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class SearchHistorySeeder extends Seeder
{
    public function run(): void
    {
        $keywords = [
            'áo ctut',
            'hoodie ctut',
            'áo khoa cntt',
            'ly giữ nhiệt',
            'freshman week',
            'nón ctut',
            'túi tote',
            'sticker',
            'bảng tên',
            'dây đeo thẻ',
        ];

        foreach (
            User::where('role', 'user')->get()
            as $user
        ) {

            foreach (
                array_slice(
                    $keywords,
                    0,
                    3
                ) as $keyword
            ) {

                SearchHistory::updateOrCreate([
                    'user_id' => $user->id,
                    'keyword' => $keyword,
                ], [
                    'user_id' => $user->id,
                    'keyword' => $keyword,
                ]);
            }

            $keywords = array_merge(
                array_slice($keywords, 1),
                [reset($keywords)]
            );
        }
    }
}
