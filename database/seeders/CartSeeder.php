<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        foreach (User::where('role', 'user')->get() as $user) {
            Cart::updateOrCreate([
                'user_id' => $user->id,
            ], [
                'user_id' => $user->id,
                'guest_token' => null,
                'status' => 'active',
            ]);
        }

        Cart::updateOrCreate([
            'guest_token' => 'guest_demo_cart_001',
        ], [
            'user_id' => null,
            'guest_token' => 'guest_demo_cart_001',
            'status' => 'active',
        ]);
    }
}
