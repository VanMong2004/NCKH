<?php

namespace App\Services\Admin;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AdminUploadService
{
    public function uploadImage(UploadedFile $file, ?string $folder = null): array
    {
        $folder = $this->normalizeFolder($folder ?: 'site-content');

        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, $this->allowedImageExtensions(), true)) {
            throw new RuntimeException('Định dạng ảnh không được hỗ trợ', 422);
        }

        $filename = $this->makeFilename($file, $extension);

        $storedPath = $file->storeAs(
            'uploads/' . $folder,
            $filename,
            'public'
        );

        if (!$storedPath) {
            throw new RuntimeException('Không thể tải ảnh lên', 500);
        }

        return [
            'disk' => 'public',
            'folder' => $folder,
            'filename' => $filename,
            'path' => '/storage/' . $storedPath,
            'storage_path' => $storedPath,
            'url' => asset('storage/' . $storedPath),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ];
    }

    private function normalizeFolder(string $folder): string
    {
        $folder = trim($folder);
        $folder = str_replace('\\', '/', $folder);
        $folder = preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $folder);
        $folder = preg_replace('#/+#', '/', $folder);
        $folder = trim($folder, '/');

        if (!$folder) {
            return 'site-content';
        }

        if (str_contains($folder, '..')) {
            throw new RuntimeException('Thư mục tải lên không hợp lệ', 422);
        }

        return $folder;
    }

    private function makeFilename(UploadedFile $file, string $extension): string
    {
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $name = Str::slug($name);

        if (!$name) {
            $name = 'image';
        }

        return $name . '-' . now()->format('YmdHis') . '-' . Str::random(8) . '.' . $extension;
    }

    private function allowedImageExtensions(): array
    {
        return [
            'jpg',
            'jpeg',
            'png',
            'webp',
            'gif',
        ];
    }
}