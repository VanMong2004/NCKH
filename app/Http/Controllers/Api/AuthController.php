<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\AuthService;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    protected $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    // =========================
    // LOGIN
    // =========================
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $result = $this->authService->login($data);

        return response()->json($result);
    }

    // =========================
    // REGISTER
    // =========================
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
            'mssv' => 'nullable|string|max:50|unique:users,mssv',
            'avatar' => 'nullable|string',
        ]);

        $result = $this->authService->register($data);

        return response()->json($result);
    }

    // =========================
    // ME
    // =========================
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
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
        ]);
    }

    // =========================
    // LOGOUT
    // =========================
    public function logout(Request $request)
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }

    // =========================
    // UPDATE PROFILE
    // =========================
    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => 'nullable|string|max:255',

            'email' => [
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($request->user()->id),
            ],

            'phone' => 'nullable|string|max:20',

            'mssv' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('users', 'mssv')->ignore($request->user()->id),
            ],

            'avatar' => 'nullable|string',
        ]);

        return response()->json(
            $this->authService->updateProfile($request->user(), $data)
        );
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    public function refresh(Request $request)
    {
        return response()->json(
            $this->authService->refreshToken($request->user())
        );
    }
}