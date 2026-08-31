<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(TaxonomySeeder::class);

        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => Hash::make('password'), 'role' => 'admin']
        );

        $seller = User::firstOrCreate(
            ['email' => 'seller@example.com'],
            ['name' => 'Demo Seller', 'password' => Hash::make('password'), 'role' => 'seller']
        );

        $customer = User::firstOrCreate(
            ['email' => 'customer@example.com'],
            ['name' => 'Demo Customer', 'password' => Hash::make('password'), 'role' => 'customer']
        );

        $customer->cart()->firstOrCreate([]);

        $this->call(ProductSeeder::class);
    }
}
