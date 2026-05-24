<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AddressService
{
    // Format lại dữ liệu address trước khi trả về cho client, giúp đảm bảo tính nhất quán và dễ dàng thay đổi cấu trúc dữ liệu nếu cần
    private function formatAddress($address)
    {
        return [
            'id' => $address->id,
            'full_name' => $address->full_name,
            'phone' => $address->phone,
            'province' => $address->province,
            'district' => $address->district,
            'ward' => $address->ward,
            'address_line' => $address->address_line,
            'postal_code' => $address->postal_code,
            'is_default' => (bool) $address->is_default,
            'created_at' => optional($address->created_at)->format('d/m/Y H:i'),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index($user)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        $addresses = Address::query()
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return [
            'success' => true,

            'message' => 'Lấy danh sách địa chỉ thành công',

            'data' => $addresses
                ->map(fn ($address) => $this->formatAddress($address))
                ->values(),
        ];
    }
    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store($user, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập');
        }

        return DB::transaction(function () use ($user, $data) {
            $hasAddress = Address::query()
                ->where('user_id', $user->id)
                ->exists();

            $isDefault = !$hasAddress;

            if (!empty($data['is_default'])) {
                Address::query()
                    ->where('user_id', $user->id)
                    ->update([
                        'is_default' => false,
                    ]);

                $isDefault = true;
            }

            $address = Address::create([
                'user_id' => $user->id,
                'full_name' => $data['full_name'],
                'phone' => $data['phone'],
                'province' => $data['province'],
                'district' => $data['district'],
                'ward' => $data['ward'],
                'address_line' => $data['address_line'],
                'postal_code' => $data['postal_code'] ?? null,
                'is_default' => $isDefault,
            ]);

            return [
                'success' => true,
                'message' => 'Tạo địa chỉ thành công',
                'data' => $this->formatAddress($address),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update($user, $id, array $data)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $id, $data) {
            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($id);

            if (!$address) {
                throw new RuntimeException('Địa chỉ không tồn tại', 404);
            }

            if (!empty($data['is_default'])) {
                Address::query()
                    ->where('user_id', $user->id)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            $address->update([
                'full_name' => $data['full_name'],
                'phone' => $data['phone'],
                'province' => $data['province'],
                'district' => $data['district'],
                'ward' => $data['ward'],
                'address_line' => $data['address_line'],
                'postal_code' => $data['postal_code'] ?? null,
                'is_default' => $data['is_default'] ?? false,
            ]);

            return [
                'success' => true,
                'message' => 'Cập nhật địa chỉ thành công',
                'data' => $this->formatAddress($address),
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $id) {
            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($id);

            if (!$address) {
                throw new RuntimeException('Địa chỉ không tồn tại', 404);
            }

            $wasDefault = $address->is_default;

            $address->delete();

            if ($wasDefault) {
                $nextAddress = Address::query()
                    ->where('user_id', $user->id)
                    ->first();

                if ($nextAddress) {
                    $nextAddress->update([
                        'is_default' => true,
                    ]);
                }
            }

            return [
                'success' => true,
                'message' => 'Xóa địa chỉ thành công',
            ];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SET DEFAULT
    |--------------------------------------------------------------------------
    */

    public function setDefault($user, $id)
    {
        if (!$user) {
            throw new RuntimeException('Vui lòng đăng nhập', 401);
        }

        return DB::transaction(function () use ($user, $id) {
            $address = Address::query()
                ->where('user_id', $user->id)
                ->find($id);

            if (!$address) {
                throw new RuntimeException('Địa chỉ không tồn tại', 404);
            }

            Address::query()
                ->where('user_id', $user->id)
                ->update([
                    'is_default' => false,
                ]);

            $address->update([
                'is_default' => true,
            ]);

            return [
                'success' => true,
                'message' => 'Đặt địa chỉ mặc định thành công',
                'data' => $this->formatAddress($address),
            ];
        });
    }
}