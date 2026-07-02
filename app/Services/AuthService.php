<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Exception;
use RuntimeException;

class AuthService
{
    protected $defaultAvatar = 'data:image/png;base64,DEFAULT_AVATAR_BASE64';

    // LOGIN
    public function login(array $data)
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new RuntimeException('Email hoặc mật khẩu không đúng', 401);
        }

        if ($user->locked_at) {
            throw new RuntimeException(
                'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
                403
            );
        }

        $this->mergeGuestCart(
            $user,
            $data['guest_token'] ?? null
        );

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

    // REGISTER
    public function register(array $data)
    {
 
        // $avatar = $data['avatar'] ?? $this->getDefaultAvatar();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => 'user',
            'avatar' => $this->getDefaultAvatar(),
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

    // ME
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

    // UPDATE PROFILE
    public function updateProfile($user, array $data, Request $request)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }

        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }

        if (array_key_exists('mssv', $data)) {
            $user->mssv = $data['mssv'];
        }

        if ($request->hasFile('avatar')) {

            // Xóa avatar cũ nếu không phải avatar mặc định
            if (
                $user->avatar &&
                !in_array($user->avatar, [
                    '/images/user/default_avatar.png',
                    '/images/users/default_avatar.png',
                ], true)
            ) {
                $oldPath = public_path(ltrim($user->avatar, '/'));

                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $file = $request->file('avatar');

            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();

            $file->move(
                public_path('images/users'),
                $fileName
            );

            $user->avatar = '/images/users/' . $fileName;
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

    // REFRESH TOKEN
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

    // LOGOUT
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

    private function mergeGuestCart(User $user, ?string $guestToken): void {
        if (!$guestToken) {
            return;
        }

        DB::transaction(function () use ($user, $guestToken) {

            $guestCart = Cart::with('items')
                ->where('guest_token', $guestToken)
                ->where('status', 'active')
                ->first();

            if (!$guestCart) {
                return;
            }

            $userCart = Cart::firstOrCreate([
                'user_id' => $user->id,
                'status' => 'active',
            ]);

            foreach ($guestCart->items as $guestItem) {

                $userItem = CartItem::where([
                    'cart_id' => $userCart->id,
                    'product_variant_id' => $guestItem->product_variant_id,
                ])->first();

                if ($userItem) {

                    $userItem->quantity += $guestItem->quantity;
                    $userItem->save();

                } else {

                    CartItem::create([
                        'cart_id' => $userCart->id,
                        'product_variant_id' => $guestItem->product_variant_id,
                        'quantity' => $guestItem->quantity,
                    ]);
                }
            }

            CartItem::where('cart_id', $guestCart->id)
                ->delete();

            $guestCart->delete();
        });
    }

    // DEFAULT AVATAR
    // private function getDefaultAvatar()
    // {
    //     $path = public_path('images/user/default_avatar.png');

    //     if (!file_exists($path)) {
    //         return null;
    //     }

    //     $image = base64_encode(file_get_contents($path));

    //     return 'data:image/png;base64,' . $image;
    // }
    private function getDefaultAvatar(): ?string
    {
        return file_exists(public_path('images/users/default_avatar.png'))
            ? '/images/users/default_avatar.png'
            : null;
    }
}
