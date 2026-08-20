<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class AuthService
{
    protected $defaultAvatar = 'data:image/png;base64,DEFAULT_AVATAR_BASE64';

    public function login(array $data)
    {
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            throw new RuntimeException('Tài khoản không tồn tại, vui lòng tạo tài khoản mới.', 404);
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw new RuntimeException('Sai email hoặc mật khẩu.', 401);
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

        return $this->buildAuthResponse($user, 'Đăng nhập thành công');
    }

    public function loginWithGoogle(array $data)
    {
        $googleProfile = $this->verifyGoogleCredential($data['credential']);
        $email = Str::lower(trim($googleProfile['email']));
        $googleId = (string) $googleProfile['sub'];

        $user = User::query()
            ->where('google_id', $googleId)
            ->orWhere('email', $email)
            ->first();

        if ($user && $user->locked_at) {
            throw new RuntimeException(
                'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
                403
            );
        }

        if (!$user) {
            $user = User::create([
                'name' => trim($googleProfile['name'] ?? 'Người dùng Google'),
                'email' => $email,
                'password' => Hash::make(Str::random(40)),
                'google_id' => $googleId,
                'role' => 'user',
                'avatar' => $googleProfile['picture'] ?? $this->getDefaultAvatar(),
            ]);
        } else {
            $user->google_id = $user->google_id ?: $googleId;

            if (!$user->avatar && !empty($googleProfile['picture'])) {
                $user->avatar = $googleProfile['picture'];
            }

            if (!$user->name && !empty($googleProfile['name'])) {
                $user->name = trim($googleProfile['name']);
            }
        }

        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
        }

        $user->save();

        $this->mergeGuestCart(
            $user,
            $data['guest_token'] ?? null
        );

        return $this->buildAuthResponse($user, 'Đăng nhập Google thành công');
    }

    public function register(array $data)
    {
        $user = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => trim((string) $data['name']),
                'email' => Str::lower(trim((string) $data['email'])),
                'password' => Hash::make($data['password']),
                'phone' => trim((string) ($data['phone'] ?? '')),
                'role' => 'user',
                'avatar' => $this->getDefaultAvatar(),
            ]);

            $this->createDefaultAddressFromRegisterData($user, $data);

            return $user;
        });

        return $this->buildAuthResponse($user, 'Đăng ký thành công');
    }

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
            if (
                $user->avatar
                && !in_array($user->avatar, [
                    '/images/user/default_avatar.png',
                    '/images/users/default_avatar.png',
                ], true)
                && !str_starts_with($user->avatar, 'http://')
                && !str_starts_with($user->avatar, 'https://')
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
            ],
        ];
    }

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
                'token' => $newToken,
            ],
        ];
    }

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

    private function mergeGuestCart(User $user, ?string $guestToken): void
    {
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

            CartItem::where('cart_id', $guestCart->id)->delete();
            $guestCart->delete();
        });
    }

    private function getDefaultAvatar(): ?string
    {
        return file_exists(public_path('images/users/default_avatar.png'))
            ? '/images/users/default_avatar.png'
            : null;
    }

    private function verifyGoogleCredential(string $credential): array
    {
        $clientId = config('services.google.client_id');

        if (!$clientId) {
            throw new RuntimeException('Chức năng đăng nhập Google chưa được cấu hình.', 500);
        }

        $response = Http::timeout(10)
            ->acceptJson()
            ->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $credential,
            ]);

        if (!$response->successful()) {
            throw new RuntimeException('Không thể xác thực tài khoản Google. Vui lòng thử lại.', 401);
        }

        $payload = $response->json();
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (
            empty($payload['sub'])
            || empty($payload['email'])
            || !$emailVerified
            || ($payload['aud'] ?? null) !== $clientId
        ) {
            throw new RuntimeException('Thông tin tài khoản Google không hợp lệ.', 401);
        }

        return $payload;
    }

    private function createDefaultAddressFromRegisterData(User $user, array $data): void
    {
        Address::create([
            'user_id' => $user->id,
            'full_name' => trim((string) $user->name),
            'phone' => trim((string) ($data['phone'] ?? '')),
            'province' => trim((string) ($data['province'] ?? '')),
            'district' => trim((string) ($data['district'] ?? '')),
            'ward' => trim((string) ($data['ward'] ?? '')),
            'address_line' => trim((string) ($data['address_line'] ?? '')),
            'postal_code' => !empty($data['postal_code'])
                ? trim((string) $data['postal_code'])
                : null,
            'is_default' => true,
        ]);
    }

    private function buildAuthResponse(User $user, string $message): array
    {
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'success' => true,
            'message' => $message,
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
            ],
        ];
    }
}
