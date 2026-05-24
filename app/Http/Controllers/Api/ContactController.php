<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ContactService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use RuntimeException;
use Throwable;

class ContactController extends Controller
{
    public function __construct(
        protected ContactService $contactService
    ) {}

    public function info()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'Lấy thông tin liên hệ thành công',
                'data' => $this->contactService->info(),
            ]);

        } catch (Throwable $e) {
            Log::error('Get contact info error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }

    public function submit(Request $request)
    {
        try {
            $data = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'nullable|string|max:20',
                'subject' => 'required|string|max:255',
                'message' => 'required|string|max:2000',
            ], [
                'full_name.required' => 'Vui lòng nhập họ tên',
                'email.required' => 'Vui lòng nhập email',
                'email.email' => 'Email không đúng định dạng',
                'subject.required' => 'Vui lòng nhập tiêu đề liên hệ',
                'message.required' => 'Vui lòng nhập nội dung liên hệ',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Gửi liên hệ thành công',
                'data' => $this->contactService->submit($data),
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu liên hệ không hợp lệ',
                'errors' => $e->errors(),
                'data' => null,
            ], 422);

        } catch (QueryException $e) {
            Log::error('Submit contact database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);

        } catch (Throwable $e) {
            Log::error('Submit contact system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
                'data' => null,
            ], 500);
        }
    }
}