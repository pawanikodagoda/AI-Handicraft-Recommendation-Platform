<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Color;
use App\Models\Material;
use App\Models\Product;
use App\Models\StyleTag;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    private const SELLERS = [
        ['name' => 'Ceylon Heritage Crafters', 'email' => 'ceylon@example.com'],
        ['name' => 'Kandy Metalworks', 'email' => 'kandy@example.com'],
        ['name' => 'Galle Coastal Gems', 'email' => 'galle@example.com'],
        ['name' => 'Lanka Loom & Wire', 'email' => 'lanka@example.com'],
        ['name' => 'Serendib Silversmiths', 'email' => 'serendib@example.com'],
        ['name' => 'Colombo Modern Artisan', 'email' => 'colombo@example.com'],
    ];

    private const PRODUCTS = [
        // Seller 0: Ceylon Heritage Crafters
        ['seller_idx' => 0, 'image' => 'gold-chain-bangle.jpg', 'title' => 'Heritage Gold Temple Bangle', 'description' => 'A heavy, intricately carved gold bangle inspired by ancient Sri Lankan temple designs. Perfect for cultural events.', 'price' => 45000, 'category' => 'Bangle', 'colors' => ['Gold'], 'materials' => ['Gold', 'Metal'], 'style_tags' => ['Traditional', 'Luxury']],
        ['seller_idx' => 0, 'image' => null, 'title' => 'Ruby Encrusted Filigree Bracelet', 'description' => 'Delicate filigree metalwork set with deep red gemstones. A true statement piece for evening wear.', 'price' => 38000, 'category' => 'Bracelet', 'colors' => ['Red', 'Gold'], 'materials' => ['Gemstone', 'Gold'], 'style_tags' => ['Evening', 'Statement']],
        ['seller_idx' => 0, 'image' => 'rose-gold-infinity.jpg', 'title' => 'Kandyan Rose Gold Infinity Bangle', 'description' => 'A modern twist on a traditional shape, featuring a seamless rose gold loop with subtle crystal accents.', 'price' => 28000, 'category' => 'Bangle', 'colors' => ['Rose Gold'], 'materials' => ['Rose Gold', 'Crystal'], 'style_tags' => ['Modern', 'Elegant']],
        ['seller_idx' => 0, 'image' => null, 'title' => 'Emerald Green Silk Beaded Bracelet', 'description' => 'Hand-woven green beads interwoven with gold wire. A lightweight but vibrant piece for daily luxury.', 'price' => 12000, 'category' => 'Bracelet', 'colors' => ['Green', 'Gold'], 'materials' => ['Beads', 'Gold'], 'style_tags' => ['Vibrant', 'Handmade']],

        // Seller 1: Kandy Metalworks
        ['seller_idx' => 1, 'image' => 'silver-crystal.jpg', 'title' => 'Hammered Silver Cuff Bangle', 'description' => 'A wide, solid silver cuff with a hand-hammered texture that catches the light beautifully. Very sturdy.', 'price' => 15000, 'category' => 'Bangle', 'colors' => ['Silver'], 'materials' => ['Silver', 'Metal'], 'style_tags' => ['Minimalist', 'Sturdy']],
        ['seller_idx' => 1, 'image' => null, 'title' => 'Oxidized Black Silver Bracelet', 'description' => 'A chunky chain bracelet made of oxidized silver for a dark, matte black finish. Urban and modern.', 'price' => 18000, 'category' => 'Bracelet', 'colors' => ['Black', 'Silver'], 'materials' => ['Silver', 'Metal'], 'style_tags' => ['Urban', 'Modern']],
        ['seller_idx' => 1, 'image' => null, 'title' => 'Brass & Leather Wrap Bracelet', 'description' => 'Premium tan leather wrapped twice around the wrist, secured with a custom cast brass clasp.', 'price' => 9500, 'category' => 'Bracelet', 'colors' => ['Gold', 'Black'], 'materials' => ['Leather', 'Metal'], 'style_tags' => ['Casual', 'Rustic']],
        ['seller_idx' => 1, 'image' => null, 'title' => 'Twin Dragon Silver Bangle', 'description' => 'A highly detailed silver bangle featuring two dragon heads facing each other at the opening. A unique artisanal piece.', 'price' => 22000, 'category' => 'Bangle', 'colors' => ['Silver'], 'materials' => ['Silver'], 'style_tags' => ['Artisanal', 'Unique']],

        // Seller 2: Galle Coastal Gems
        ['seller_idx' => 2, 'image' => 'pearl-strand.jpg', 'title' => 'Galle Fort Pearl Strand', 'description' => 'A string of flawless white pearls sourced from coastal merchants, finished with a silver clasp.', 'price' => 32000, 'category' => 'Bracelet', 'colors' => ['White', 'Silver'], 'materials' => ['Pearl', 'Silver'], 'style_tags' => ['Classic', 'Wedding']],
        ['seller_idx' => 2, 'image' => 'blue-heart-charm.jpg', 'title' => 'Ocean Sapphire Charm Bracelet', 'description' => 'A fine silver chain adorned with tiny blue glass charms reminiscent of the deep Indian Ocean.', 'price' => 11000, 'category' => 'Bracelet', 'colors' => ['Blue', 'Silver'], 'materials' => ['Glass', 'Charm', 'Silver'], 'style_tags' => ['Coastal', 'Delicate']],
        ['seller_idx' => 2, 'image' => null, 'title' => 'Sea Glass & White Wire Bangle', 'description' => 'Tumbled ocean glass set into a minimalist white-gold coated bangle. Very beachy and luxurious.', 'price' => 14000, 'category' => 'Bangle', 'colors' => ['Blue', 'White'], 'materials' => ['Glass', 'Metal'], 'style_tags' => ['Beach', 'Luxury']],
        ['seller_idx' => 2, 'image' => null, 'title' => 'Pink Coral Bead Bracelet', 'description' => 'Bright pink coral-colored beads strung on a durable elastic core. Adds a pop of colour to any outfit.', 'price' => 8000, 'category' => 'Bracelet', 'colors' => ['Pink'], 'materials' => ['Beads'], 'style_tags' => ['Bright', 'Casual']],

        // Seller 3: Lanka Loom & Wire
        ['seller_idx' => 3, 'image' => null, 'title' => 'Woven Copper & Gold Bangle', 'description' => 'Multiple thin strands of copper and gold wire woven together into a thick, textured bangle.', 'price' => 16500, 'category' => 'Bangle', 'colors' => ['Gold'], 'materials' => ['Gold', 'Metal'], 'style_tags' => ['Textured', 'Warm']],
        ['seller_idx' => 3, 'image' => null, 'title' => 'Amethyst Purple Wire Wrap Bracelet', 'description' => 'A central rough purple amethyst stone wrapped intricately in silver wire on a leather band.', 'price' => 19000, 'category' => 'Bracelet', 'colors' => ['Purple', 'Silver'], 'materials' => ['Gemstone', 'Silver', 'Leather'], 'style_tags' => ['Boho', 'Gemstone']],
        ['seller_idx' => 3, 'image' => null, 'title' => 'Minimalist White Gold Cuff', 'description' => 'A sleek, perfectly polished white gold cuff. The epitome of modern minimalist luxury.', 'price' => 35000, 'category' => 'Bangle', 'colors' => ['White'], 'materials' => ['Metal'], 'style_tags' => ['Minimalist', 'Luxury']],
        ['seller_idx' => 3, 'image' => null, 'title' => 'Rainbow Crystal Tennis Bracelet', 'description' => 'A continuous line of multi-coloured crystals set in a flexible silver base. Playful yet highly premium.', 'price' => 24000, 'category' => 'Bracelet', 'colors' => ['Red', 'Blue', 'Green', 'Pink'], 'materials' => ['Crystal', 'Silver'], 'style_tags' => ['Playful', 'Sparkle']],

        // Seller 4: Serendib Silversmiths
        ['seller_idx' => 4, 'image' => null, 'title' => 'Moonstone Silver Filigree Bangle', 'description' => 'A traditional moonstone set in a wide silver bangle with intricate lace-like filigree cutouts.', 'price' => 26000, 'category' => 'Bangle', 'colors' => ['Silver', 'White'], 'materials' => ['Silver', 'Gemstone'], 'style_tags' => ['Traditional', 'Intricate']],
        ['seller_idx' => 4, 'image' => null, 'title' => 'Black Onyx Men\'s Bracelet', 'description' => 'Matte black onyx beads paired with a single brushed silver bead on a heavy duty stretch cord.', 'price' => 12500, 'category' => 'Bracelet', 'colors' => ['Black', 'Silver'], 'materials' => ['Gemstone', 'Beads', 'Silver'], 'style_tags' => ['Mens', 'Matte']],
        ['seller_idx' => 4, 'image' => null, 'title' => 'Star Charm Silver Chain', 'description' => 'A delicate silver link chain with five tiny polished silver star charms. A beautiful everyday piece.', 'price' => 10500, 'category' => 'Bracelet', 'colors' => ['Silver'], 'materials' => ['Silver', 'Charm'], 'style_tags' => ['Everyday', 'Delicate']],
        ['seller_idx' => 4, 'image' => null, 'title' => 'Rose Gold Hammered Bangle', 'description' => 'Solid rose gold bangle with a deeply textured hammered finish that glitters in the sun.', 'price' => 31000, 'category' => 'Bangle', 'colors' => ['Rose Gold'], 'materials' => ['Rose Gold'], 'style_tags' => ['Textured', 'Luxury']],

        // Seller 5: Colombo Modern Artisan
        ['seller_idx' => 5, 'image' => null, 'title' => 'Geometric Gold Bangle', 'description' => 'A hexagonal shaped bangle made from brushed gold. A highly contemporary architectural design.', 'price' => 28000, 'category' => 'Bangle', 'colors' => ['Gold'], 'materials' => ['Gold'], 'style_tags' => ['Contemporary', 'Geometric']],
        ['seller_idx' => 5, 'image' => null, 'title' => 'Resin & Glass Clear Bangle', 'description' => 'A thick, completely transparent resin bangle with shards of colored glass suspended inside.', 'price' => 8500, 'category' => 'Bangle', 'colors' => ['White', 'Blue', 'Pink'], 'materials' => ['Glass'], 'style_tags' => ['Modern', 'Transparent']],
        ['seller_idx' => 5, 'image' => null, 'title' => 'Emerald Cut Crystal Bracelet', 'description' => 'Large emerald-cut green crystals linked together in a heavy silver setting. Pure glamour.', 'price' => 29000, 'category' => 'Bracelet', 'colors' => ['Green', 'Silver'], 'materials' => ['Crystal', 'Silver'], 'style_tags' => ['Glamour', 'Statement']],
        ['seller_idx' => 5, 'image' => null, 'title' => 'Braided Leather & Gold Clasp', 'description' => 'Thick braided black leather bracelet finished with a heavy, magnetic gold clasp. Very secure and stylish.', 'price' => 17000, 'category' => 'Bracelet', 'colors' => ['Black', 'Gold'], 'materials' => ['Leather', 'Gold'], 'style_tags' => ['Stylish', 'Secure']],
    ];

    public function run(): void
    {
        // Generate the 6 premium sellers
        $sellerIds = [];
        foreach (self::SELLERS as $sellerData) {
            $seller = User::firstOrCreate(
                ['email' => $sellerData['email']],
                ['name' => $sellerData['name'], 'password' => Hash::make('password'), 'role' => 'seller']
            );
            $sellerIds[] = $seller->id;
        }

        foreach (self::PRODUCTS as $data) {
            $category = Category::firstOrCreate(
                ['name' => $data['category']],
                ['slug' => Str::slug($data['category'])]
            );

            $imagePath = $data['image'] ? $this->storeSeedImage($data['image']) : null;

            $product = Product::create([
                'seller_id' => $sellerIds[$data['seller_idx']],
                'category_id' => $category->id,
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'description' => $data['description'],
                'price' => $data['price'],
                'stock' => rand(4, 18),
                'status' => 'published',
                'view_count' => rand(5, 90),
                'images' => $imagePath ? [$imagePath] : [],
                'bracelet_image_path' => $imagePath,
            ]);

            $product->colors()->sync(collect($data['colors'])->map(fn ($n) => Color::firstOrCreate(['name' => $n])->id));
            $product->materials()->sync(collect($data['materials'])->map(fn ($n) => Material::firstOrCreate(['name' => $n])->id));
            $product->styleTags()->sync(collect($data['style_tags'])->map(fn ($n) => StyleTag::firstOrCreate(['name' => $n])->id));
        }
    }

    private function storeSeedImage(string $filename): ?string
    {
        $source = database_path('seed-assets/'.$filename);
        if (! is_file($source)) {
            return null;
        }

        $path = 'products/'.$filename;
        Storage::disk('public')->put($path, file_get_contents($source));

        return $path;
    }
}
