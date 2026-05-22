<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ContactService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function __construct(
        protected ContactService $contactService
    ) {}

    public function info()
    {
        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin liên hệ thành công',
            'data' => $this->contactService->info(),
        ]);
    }

    public function submit(Request $request)
    {
        $data = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gửi liên hệ thành công',
            'data' => $this->contactService->submit($data),
        ]);
    }
}