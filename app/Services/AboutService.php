<?php

namespace App\Services;

use App\Models\About;

class AboutService
{
    public function show()
    {
        $about = About::query()
            ->where('is_active', true)
            ->latest()
            ->first();

        if (!$about) {
            return null;
        }

        return [
            'id' => $about->id,
            'title' => $about->title,
            'slogan' => $about->slogan,
            'banner' => $about->banner,
            'description' => $about->description,
            'mission' => $about->mission,
            'vision' => $about->vision,

            'stats' => [
                'student_count' => (int) $about->student_count,
                'major_count' => (int) $about->major_count,
                'teacher_count' => (int) $about->teacher_count,
                'years_of_operation' => (int) $about->years_of_operation,
            ],

            'gallery' => $about->gallery ?? [],
        ];
    }
}