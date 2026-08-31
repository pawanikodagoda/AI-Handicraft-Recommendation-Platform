<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TaxonomySeeder extends Seeder
{
    public function run(): void
    {
        // Matches ai-services/tagging-service/taxonomy.py CATEGORY_KEYWORDS
        // so seller listings and the NLP tagger stay in sync.
        foreach (['Bracelet', 'Bangle', 'Anklet'] as $name) {
            Category::firstOrCreate(['name' => $name], ['slug' => Str::slug($name)]);
        }
    }
}
