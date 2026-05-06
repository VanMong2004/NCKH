<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    protected $defaultAvatar = 'data:image/png;base64,DEFAULT_AVATAR_BASE64';

    // =========================
    // LOGIN
    // =========================
    public function login($data)
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ];
    }

    // =========================
    // REGISTER
    // =========================
    public function register($data)
    {
        // 🔥 auto detect role (optional)
        $role = 'user';

        $avatar = $data['avatar'] ?? $this->getDefaultAvatar();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
            'avatar' => $avatar,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Đăng ký thành công',
            'data' => [
                'user' => $user,
                'token' => $token,
            ]
        ];
    }

    // =========================
    // UPDATE PROFILE
    // =========================
    public function updateProfile($user, $data)
    {
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        if (isset($data['avatar'])) {
            $user->avatar = $data['avatar'];
        }

        $user->save();

        return [
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'data' => $user
        ];
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    public function refreshToken($user)
    {
        // xoá token cũ
        $user->tokens()->delete();

        $newToken = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Refresh token thành công',
            'data' => [
                'token' => $newToken
            ]
        ];
    }

    // =========================
    // LOGOUT
    // =========================
    public function logout($user)
    {
        $user->tokens()->delete();
    }

    // =========================
    // DEFAULT AVATAR
    // =========================
    private function getDefaultAvatar()
    {
        $path = resource_path('images/default_avatar.png');

        if (!file_exists($path)) {
            return null;
        }

        $image = base64_encode(file_get_contents($path));

        return 'data:image/png;base64,' . $image;
    }
}