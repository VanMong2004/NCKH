<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Exception;
use RuntimeException;

class AuthService
{
    protected $defaultAvatar = 'data:image/png;base64,DEFAULT_AVATAR_BASE64';

    // =========================
    // LOGIN
    // =========================
    public function login(array $data)
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new RuntimeException('Email hoặc mật khẩu không đúng', 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'mssv' => $user->mssv,
                    'role' => $user->role,
                    'avatar' => $user->avatar_url,
                ],
                'token' => $token,
            ]
        ];
    }

    // =========================
    // REGISTER
    // =========================
    public function register(array $data)
    {
 
        $avatar = $data['avatar'] ?? $this->getDefaultAvatar();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => 'user',
            'avatar' => $avatar,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => 'Đăng ký thành công',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'avatar' => $user->avatar_url,
                ],
                'token' => $token,
            ]
        ];
    }

    // =========================
    // ME
    // =========================
    public function me($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        return [
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'mssv' => $user->mssv,
                'role' => $user->role,
                'avatar' => $user->avatar_url,
            ],
        ];
    }

    // =========================
    // UPDATE PROFILE
    // =========================
    public function updateProfile($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }

        if (isset($data['mssv'])) {
            $user->mssv = $data['mssv'];
        }

        if (isset($data['avatar'])) {
            $user->avatar = $data['avatar'];
        }

        $user->save();

        return [
            'success' => true,
            'message' => 'Cập nhật thông tin thành công',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'mssv' => $user->mssv,
                'role' => $user->role,
                'avatar' => $user->avatar_url,
            ]
        ];
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    public function refreshToken($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

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
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $user->tokens()->delete();

        return [
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ];
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