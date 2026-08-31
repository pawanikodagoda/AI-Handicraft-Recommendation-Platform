<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Color;
use App\Models\Material;
use App\Models\Product;
use App\Models\StyleTag;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->where('status', 'published')
            ->with(['category', 'materials', 'colors', 'styleTags', 'seller:id,name']);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->string('category')));
        }

        if ($request->filled('materials')) {
            $materials = (array) $request->input('materials');
            $query->whereHas('materials', fn ($q) => $q->whereIn('name', $materials));
        }

        if ($request->filled('colors')) {
            $colors = (array) $request->input('colors');
            $query->whereHas('colors', fn ($q) => $q->whereIn('name', $colors));
        }

        if ($request->filled('price_min')) {
            $query->where('price', '>=', $request->float('price_min'));
        }

        if ($request->filled('price_max')) {
            $query->where('price', '<=', $request->float('price_max'));
        }

        if ($request->filled('q')) {
            $search = $request->string('q');
            $query->where(fn ($q) => $q
                ->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%"));
        }

        match ($request->string('sort')->toString()) {
            'price_asc' => $query->orderBy('price', 'asc'),
            'price_desc' => $query->orderBy('price', 'desc'),
            default => $query->latest(),
        };

        return $query->paginate(12);
    }

    public function show(Product $product)
    {
        abort_unless($product->status === 'published', 404);

        $product->increment('view_count');
        $product->load(['category', 'materials', 'colors', 'styleTags', 'seller:id,name']);

        return $product;
    }

    public function mine(Request $request)
    {
        return $request->user()
            ->products()
            ->with(['category', 'materials', 'colors', 'styleTags'])
            ->latest()
            ->paginate(12);
    }

    /**
     * Fetch one of the seller's own products for editing. Separate from
     * show() because that one is public and only serves published
     * products - a seller must be able to reopen their own drafts.
     */
    public function edit(Request $request, Product $product)
    {
        abort_unless($product->seller_id === $request->user()->id, 403);

        return $product->load(['category', 'materials', 'colors', 'styleTags']);
    }

    /**
     * Public headline numbers for the homepage - real counts rather than
     * invented marketing figures.
     */
    public function stats()
    {
        return [
            'products' => Product::where('status', 'published')->count(),
            'sellers' => User::where('role', 'seller')
                ->whereHas('products', fn ($q) => $q->where('status', 'published'))
                ->count(),
            'categories' => Category::whereHas('products', fn ($q) => $q->where('status', 'published'))->count(),
        ];
    }

    /**
     * Filter options built from what is actually published, so materials
     * and colours a seller invented (or the tagger inferred) are
     * filterable instead of being stuck behind a hardcoded list.
     */
    public function filters()
    {
        $publishedIds = Product::where('status', 'published')->pluck('id');

        return [
            'materials' => Material::whereHas('products', fn ($q) => $q->whereIn('products.id', $publishedIds))
                ->orderBy('name')->pluck('name'),
            'colors' => Color::whereHas('products', fn ($q) => $q->whereIn('products.id', $publishedIds))
                ->orderBy('name')->pluck('name'),
            'style_tags' => StyleTag::whereHas('products', fn ($q) => $q->whereIn('products.id', $publishedIds))
                ->orderBy('name')->pluck('name'),
            'price_min' => (float) (Product::where('status', 'published')->min('price') ?? 0),
            'price_max' => (float) (Product::where('status', 'published')->max('price') ?? 0),
        ];
    }

    public function store(Request $request)
    {
        $data = $this->validateProduct($request);

        $product = new Product($data['fields']);
        $product->seller_id = $request->user()->id;
        $product->slug = $this->uniqueSlug($data['fields']['title']);
        $product->images = $this->storeImages($request);
        $product->bracelet_image_path = $this->storeBraceletImage($request) ?? ($product->images[0] ?? null);
        $product->save();

        $this->syncTaxonomies($product, $data);

        return response()->json($product->load(['category', 'materials', 'colors', 'styleTags']), 201);
    }

    public function update(Request $request, Product $product)
    {
        abort_unless($product->seller_id === $request->user()->id, 403);

        $data = $this->validateProduct($request, updating: true);

        $product->fill($data['fields']);

        if ($request->filled('title') && $request->string('title') !== $product->getOriginal('title')) {
            $product->slug = $this->uniqueSlug($data['fields']['title'], $product->id);
        }

        // Photos are only touched when new ones are actually uploaded -
        // editing the price of a listing must not wipe its images.
        if ($request->hasFile('images')) {
            $replaced = $product->images ?? [];
            $product->images = $this->storeImages($request);

            if ($product->bracelet_image_path && in_array($product->bracelet_image_path, $replaced, true)) {
                $product->bracelet_image_path = $product->images[0] ?? null;
            }

            $this->deleteStoredFiles(array_diff($replaced, [$product->bracelet_image_path]));
        }

        if ($request->hasFile('bracelet_image')) {
            $previous = $product->bracelet_image_path;
            $product->bracelet_image_path = $this->storeBraceletImage($request);

            if ($previous && ! in_array($previous, $product->images ?? [], true)) {
                $this->deleteStoredFiles([$previous]);
            }
        }

        $product->save();
        $this->syncTaxonomies($product, $data);

        return $product->fresh(['category', 'materials', 'colors', 'styleTags']);
    }

    public function destroy(Request $request, Product $product)
    {
        abort_unless($product->seller_id === $request->user()->id, 403);
        $product->delete();

        return response()->noContent();
    }

    private function validateProduct(Request $request, bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        $validated = $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'category' => [$required, 'string', 'max:100'],
            'materials' => ['sometimes', 'array'],
            'materials.*' => ['string', 'max:100'],
            'colors' => ['sometimes', 'array'],
            'colors.*' => ['string', 'max:100'],
            'style_tags' => ['sometimes', 'array'],
            'style_tags.*' => ['string', 'max:100'],
            'status' => ['sometimes', 'in:draft,published'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['image', 'max:5120'],
            'bracelet_image' => ['sometimes', 'image', 'max:5120'],
        ]);

        $fields = collect($validated)->only(['title', 'description', 'price', 'stock', 'status'])->all();

        if (isset($validated['category'])) {
            $category = Category::firstOrCreate(
                ['name' => $validated['category']],
                ['slug' => Str::slug($validated['category'])]
            );
            $fields['category_id'] = $category->id;
        }

        return ['fields' => $fields, 'raw' => $validated];
    }

    private function syncTaxonomies(Product $product, array $data): void
    {
        $raw = $data['raw'];

        if (array_key_exists('materials', $raw)) {
            $product->materials()->sync($this->resolveNames(Material::class, $raw['materials']));
        }
        if (array_key_exists('colors', $raw)) {
            $product->colors()->sync($this->resolveNames(Color::class, $raw['colors']));
        }
        if (array_key_exists('style_tags', $raw)) {
            $product->styleTags()->sync($this->resolveNames(StyleTag::class, $raw['style_tags']));
        }
    }

    private function resolveNames(string $model, array $names): array
    {
        return collect($names)
            ->filter()
            ->map(fn ($name) => $model::firstOrCreate(['name' => $name])->id)
            ->values()
            ->all();
    }

    private function storeImages(Request $request): array
    {
        if (! $request->hasFile('images')) {
            return [];
        }

        return collect($request->file('images'))
            ->map(fn ($file) => $file->store('products', 'public'))
            ->values()
            ->all();
    }

    private function storeBraceletImage(Request $request): ?string
    {
        return $request->hasFile('bracelet_image')
            ? $request->file('bracelet_image')->store('products/bracelet-cutouts', 'public')
            : null;
    }

    private function deleteStoredFiles(iterable $paths): void
    {
        foreach ($paths as $path) {
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i = 1;

        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-".(++$i);
        }

        return $slug;
    }
}
