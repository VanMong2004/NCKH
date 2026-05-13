<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

class AddressService
{
    /*
    |--------------------------------------------------------------------------
    | LIST
    |--------------------------------------------------------------------------
    */

    public function index($user)
    {
        $addresses = Address::query()
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return [
            'success' => true,

            'message'
                => 'Lấy danh sách địa chỉ thành công',

            'data'
                => $addresses,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store($user, array $data)
    {
        return DB::transaction(function () use ($user, $data) {

            $hasAddress = Address::query()
                ->where('user_id', $user->id)
                ->exists();

            /*
            |--------------------------------------------------------------------------
            | FIRST ADDRESS => DEFAULT
            |--------------------------------------------------------------------------
            */

            $isDefault = !$hasAddress;

            /*
            |--------------------------------------------------------------------------
            | USER CHOOSE DEFAULT
            |--------------------------------------------------------------------------
            */

            if (!empty($data['is_default'])) {

                Address::query()
                    ->where('user_id', $user->id)
                    ->update([
                        'is_default' => false
                    ]);

                $isDefault = true;
            }

            $address = Address::create([

                'user_id'
                    => $user->id,

                'full_name'
                    => $data['full_name'],

                'phone'
                    => $data['phone'],

                'province'
                    => $data['province'],

                'district'
                    => $data['district'],

                'ward'
                    => $data['ward'],

                'address_line'
                    => $data['address_line'],

                'postal_code'
                    => $data['postal_code'] ?? null,

                'is_default'
                    => $isDefault,
            ]);

            return [
                'success' => true,

                'message'
                    => 'Tạo địa chỉ thành công',

                'data'
                    => $address,
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
        return DB::transaction(function () use (
            $user,
            $id,
            $data
        ) {

            $address = Address::query()
                ->where('user_id', $user->id)
                ->findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | UPDATE DEFAULT
            |--------------------------------------------------------------------------
            */

            if (!empty($data['is_default'])) {

                Address::query()
                    ->where('user_id', $user->id)
                    ->update([
                        'is_default' => false
                    ]);
            }

            $address->update([

                'full_name'
                    => $data['full_name'],

                'phone'
                    => $data['phone'],

                'province'
                    => $data['province'],

                'district'
                    => $data['district'],

                'ward'
                    => $data['ward'],

                'address_line'
                    => $data['address_line'],

                'postal_code'
                    => $data['postal_code'] ?? null,

                'is_default'
                    => $data['is_default'] ?? false,
            ]);

            return [
                'success' => true,

                'message'
                    => 'Cập nhật địa chỉ thành công',

                'data'
                    => $address,
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
        return DB::transaction(function () use (
            $user,
            $id
        ) {

            $address = Address::query()
                ->where('user_id', $user->id)
                ->findOrFail($id);

            $wasDefault = $address->is_default;

            $address->delete();

            /*
            |--------------------------------------------------------------------------
            | AUTO NEW DEFAULT
            |--------------------------------------------------------------------------
            */

            if ($wasDefault) {

                $nextAddress = Address::query()
                    ->where('user_id', $user->id)
                    ->first();

                if ($nextAddress) {

                    $nextAddress->update([
                        'is_default' => true
                    ]);
                }
            }

            return [
                'success' => true,

                'message'
                    => 'Xóa địa chỉ thành công',
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
        return DB::transaction(function () use (
            $user,
            $id
        ) {

            $address = Address::query()
                ->where('user_id', $user->id)
                ->findOrFail($id);

            Address::query()
                ->where('user_id', $user->id)
                ->update([
                    'is_default' => false
                ]);

            $address->update([
                'is_default' => true
            ]);

            return [
                'success' => true,

                'message'
                    => 'Đặt địa chỉ mặc định thành công',

                'data'
                    => $address,
            ];
        });
    }
}