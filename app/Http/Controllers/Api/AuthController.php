<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
                'guest_token' => 'nullable|string|max:255',
            ]);

            $result = $this->authService->login($data);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đăng nhập không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'AUTH_FAILED',
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            Log::error('Login system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function google(Request $request)
    {
        try {
            $data = $request->validate([
                'credential' => 'required|string',
                'guest_token' => 'nullable|string|max:255',
            ]);

            $result = $this->authService->loginWithGoogle($data);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đăng nhập Google không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_code' => 'AUTH_GOOGLE_FAILED',
                'data' => null,
            ], $this->httpStatus($e));
        } catch (Throwable $e) {
            Log::error('Google login system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:6|confirmed',
                'phone' => 'nullable|string|max:20',
            ], [
                'name.required' => 'Vui lòng nhập họ tên',
                'name.max' => 'Họ tên không được vượt quá 255 ký tự',
                'email.required' => 'Vui lòng nhập email',
                'email.email' => 'Email không đúng định dạng',
                'email.unique' => 'Email đã được sử dụng',
                'password.required' => 'Vui lòng nhập mật khẩu',
                'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự',
                'password.confirmed' => 'Xác nhận mật khẩu không khớp',
                'phone.max' => 'Số điện thoại không được vượt quá 20 ký tự',
            ]);

            $result = $this->authService->register($data);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu đăng ký không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (QueryException $e) {
            Log::error('Register database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        } catch (Throwable $e) {
            Log::error('Register system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $result = $this->authService->me($request->user());

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        } catch (Throwable $e) {
            Log::error('Get current user error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $result = $this->authService->logout($request->user());

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        } catch (Throwable $e) {
            Log::error('Logout system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                throw new RuntimeException('Vui lòng đăng nhập');
            }

            $data = $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => [
                    'nullable',
                    'email',
                    Rule::unique('users', 'email')->ignore($user->id),
                ],
                'phone' => 'nullable|string|max:20',
                'mssv' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('users', 'mssv')->ignore($user->id),
                ],
                'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            ], [
                'name.max' => 'Họ tên không được vượt quá 255 ký tự',
                'email.email' => 'Email không đúng định dạng',
                'email.unique' => 'Email đã được sử dụng',
                'phone.max' => 'Số điện thoại không được vượt quá 20 ký tự',
                'mssv.max' => 'Mã số sinh viên không được vượt quá 50 ký tự',
                'mssv.unique' => 'Mã số sinh viên đã được sử dụng',
                'avatar.image' => 'Avatar phải là hình ảnh',
                'avatar.mimes' => 'Avatar chỉ hỗ trợ jpg, jpeg, png, webp',
                'avatar.max' => 'Avatar không được vượt quá 2MB',
            ]);

            $result = $this->authService->updateProfile($user, $data, $request);

            return response()->json($result);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dữ liệu cập nhật không hợp lệ',
                'errors' => $e->errors(),
            ], 422);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        } catch (QueryException $e) {
            Log::error('Update profile database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        } catch (Throwable $e) {
            Log::error('Update profile system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    public function refresh(Request $request)
    {
        try {
            $result = $this->authService->refreshToken($request->user());

            return response()->json($result);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 401);
        } catch (QueryException $e) {
            Log::error('Refresh token database error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        } catch (Throwable $e) {
            Log::error('Refresh token system error', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Đã xảy ra lỗi hệ thống',
            ], 500);
        }
    }

    private function httpStatus(Throwable $e, int $fallback = 400): int
    {
        $code = $e->getCode();

        return is_int($code) && in_array($code, [400, 401, 403, 404, 409, 422, 500], true)
            ? $code
            : $fallback;
    }
}
