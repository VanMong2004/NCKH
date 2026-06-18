<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AdminUploadController extends Controller
{
    public function __construct(
        protected AdminUploadService $service
    ) {}

    /*
        Admin upload ảnh
                ↓
        POST /api/admin/uploads/image
                ↓
        Laravel lưu file vào storage/app/public/uploads/site-content
                ↓
        Trả về path ảnh
                ↓
        Admin update component/item
                ↓
        PUT /api/admin/site-components/{id}
        hoặc
        PUT /api/admin/site-component-items/{id}
                ↓
        DB lưu path ảnh vào image/mobile_image
                ↓
        FE trang chủ gọi GET /api/home
                ↓
        API trả site_content.navbar/footer/hero_slider...
                ↓
        FE hiển thị text + image động
    */

    public function image(Request $request)
    {
        try {
            $data = $request->validate([
                'image' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:4096',
                'folder' => 'nullable|string|max:120',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tải ảnh lên thành công',
                'data' => $this->service->uploadImage(
                    $request->file('image'),
                    $data['folder'] ?? 'site-content'
                ),
            ], 201);
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (RuntimeException $e) {
            return $this->businessError($e);
        } catch (Throwable $e) {
            return $this->systemError($e, 'Admin upload image error');
        }
    }

    private function validationError(ValidationException $e)
    {
        return response()->json([
            'success' => false,
            'message' => 'Dữ liệu tải lên không hợp lệ',
            'errors' => $e->errors(),
            'data' => null,
        ], 422);
    }

    private function businessError(RuntimeException $e)
    {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'data' => null,
        ], $e->getCode() ?: 400);
    }

    private function systemError(Throwable $e, string $logMessage)
    {
        Log::error($logMessage, [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Đã xảy ra lỗi hệ thống',
            'data' => null,
        ], 500);
    }
}