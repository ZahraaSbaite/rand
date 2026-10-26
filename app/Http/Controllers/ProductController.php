<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\AdminSession;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    private const SORTS = [
        'newest' => 'created_at DESC',
        'price_asc' => 'price_cents ASC',
        'price_desc' => 'price_cents DESC',
        'featured' => 'featured DESC, rating DESC',
        'bestselling' => 'bestseller DESC, review_count DESC',
    ];

    // Stock is set per variant (see syncVariants), not on the product.
    private const FIELDS = [
        'name', 'description', 'price_cents', 'image_url', 'images', 'yarn_color',
        'category', 'materials', 'dimensions', 'care_instructions',
        'production_time', 'featured', 'bestseller', 'status', 'fulfillment', 'custom_colors',
    ];

    // Drafts are unfinished and discontinued pieces are retired: neither is listed.
    private const LISTED = ['published', 'sold_out', 'unavailable'];

    private const MAX_GROUPS = 3;

    private const MAX_VALUES = 30;

    private const MAX_VARIANTS = 200;

    // GET /api/products?category=&minPrice=&maxPrice=&inStock=&featured=&bestseller=&sort=
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }
        if ($request->has('minPrice')) {
            $query->where('price_cents', '>=', (float) $request->query('minPrice'));
        }
        if ($request->has('maxPrice')) {
            $query->where('price_cents', '<=', (float) $request->query('maxPrice'));
        }
        if ($request->query('inStock') === 'true') {
            $query->where('status', 'published')->whereExists(fn ($q) => $q
                ->from('product_variants')
                ->whereColumn('product_variants.product_id', 'products.id')
                ->where('is_available', true)
                ->where(fn ($q) => $q->where('stock_quantity', '>', 0)->orWhereRaw("products.fulfillment = 'made_to_order'")));
        }
        if ($request->query('featured') === 'true') {
            $query->where('featured', true);
        }
        if ($request->query('bestseller') === 'true') {
            $query->where('bestseller', true);
        }
        // Drafts and discontinued pieces are only listed for a signed-in admin asking for them.
        if (! ($request->query('all') === 'true' && AdminSession::check($request))) {
            $query->whereIn('status', self::LISTED);
        }

        $sort = self::SORTS[$request->query('sort')] ?? self::SORTS['newest'];

        return $query->with('variants')->orderByRaw($sort)->get();
    }

    // GET /api/products/{id}
    // A discontinued piece keeps its page (old links, past orders) but can't be bought.
    public function show(Request $request, int $id)
    {
        $product = Product::with('variants')
            ->when(! AdminSession::check($request), fn ($q) => $q->where('status', '!=', 'draft'))
            ->find($id);

        return $product ?? $this->error('Product not found', 404);
    }

    // POST /api/products
    // option_groups: [{name, values: [..]}]; variants: [{options: {name: value}, stock_quantity, is_available}].
    // Without options, send one variant with options {} (or just stock_quantity).
    public function store(Request $request)
    {
        if (! $request->filled('name') || $request->input('price_cents') === null) {
            return $this->error('name and price_cents are required', 400);
        }
        if ($invalid = $this->invalidProduct($request)) {
            return $invalid;
        }

        $groups = $request->input('option_groups', []);
        $variants = $this->variantsFrom($request, $groups);
        if ($variants instanceof JsonResponse) {
            return $variants;
        }

        $product = new Product([
            'images' => [],
            'colors' => [],
            'stock_quantity' => 0,
            'featured' => false,
            'bestseller' => false,
            'status' => 'published',
            'fulfillment' => 'ready',
            ...$this->provided($request, self::FIELDS),
            'option_groups' => $groups,
        ]);

        return $this->saving(function () use ($product, $variants) {
            $product->save();
            $this->syncVariants($product, $variants);

            return response()->json($product->refresh()->load('variants'), 201);
        });
    }

    // PUT /api/products/{id} - any subset of fields. Options and variants are
    // replaced together; a bare stock_quantity sets the stock of a product without options.
    public function update(Request $request, int $id)
    {
        $product = Product::with('variants')->find($id);
        if (! $product) {
            return $this->error('Product not found', 404);
        }
        if ($invalid = $this->invalidProduct($request)) {
            return $invalid;
        }

        $variants = null;
        if ($request->has('option_groups') || $request->has('variants')) {
            $groups = $request->input('option_groups', $product->option_groups ?? []);
            $variants = $this->variantsFrom($request, $groups);
            if ($variants instanceof JsonResponse) {
                return $variants;
            }
            $product->option_groups = $groups;
        } elseif ($request->input('stock_quantity') !== null) {
            if ($product->variants->count() !== 1) {
                return $this->error('This product has options, so set the stock of each option instead.', 400);
            }
            $only = $product->variants->first();
            $variants = [[
                'options' => $only->options,
                'stock_quantity' => max(0, (int) $request->input('stock_quantity')),
                'is_available' => $only->is_available,
            ]];
        }

        return $this->saving(function () use ($product, $request, $variants) {
            $product->fill($this->provided($request, self::FIELDS))->save();
            if ($variants !== null) {
                $this->syncVariants($product, $variants);
            }

            return $product->refresh()->load('variants');
        });
    }

    /** Runs a product save in a transaction, turning a duplicate name into a 409. */
    private function saving(callable $save)
    {
        try {
            return DB::transaction($save);
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return $this->error('A product with that name already exists', 409);
            }
            throw $e;
        }
    }

    private function invalidProduct(Request $request): ?JsonResponse
    {
        $status = $request->input('status');
        if ($status !== null && ! in_array($status, Product::STATUSES, true)) {
            return $this->error('Invalid status', 400);
        }
        $fulfillment = $request->input('fulfillment');
        if ($fulfillment !== null && ! in_array($fulfillment, Product::FULFILLMENTS, true)) {
            return $this->error('Invalid fulfillment', 400);
        }
        $colors = $request->input('custom_colors');
        if ($colors !== null && (! is_int($colors) || $colors < 0 || $colors > Product::MAX_CUSTOM_COLORS)) {
            return $this->error('custom_colors must be a whole number from 0 to '.Product::MAX_CUSTOM_COLORS, 400);
        }

        return null;
    }

    /**
     * Checks the option groups (cleaning them in place) and the variants
     * against them. Returns the variants in a clean shape, or an error response.
     */
    private function variantsFrom(Request $request, mixed &$groups): array|JsonResponse
    {
        if (! is_array($groups) || ! array_is_list($groups) || count($groups) > self::MAX_GROUPS) {
            return $this->error('Up to '.self::MAX_GROUPS.' options (like color, size, strap) are allowed', 400);
        }

        $clean = [];
        $names = [];
        foreach ($groups as $group) {
            $name = is_array($group) && is_string($group['name'] ?? null) ? trim($group['name']) : '';
            $values = is_array($group['values'] ?? null) ? $group['values'] : [];
            if ($name === '' || mb_strlen($name) > 40) {
                return $this->error('Each option needs a name of up to 40 characters', 400);
            }
            if (in_array(mb_strtolower($name), $names, true)) {
                return $this->error("The option \"{$name}\" is listed twice", 400);
            }
            $names[] = mb_strtolower($name);

            $cleanValues = [];
            foreach ($values as $value) {
                $value = is_string($value) ? trim($value) : '';
                if ($value === '' || mb_strlen($value) > 60) {
                    return $this->error("Each choice for \"{$name}\" needs up to 60 characters", 400);
                }
                if (! in_array($value, $cleanValues, true)) {
                    $cleanValues[] = $value;
                }
            }
            if ($cleanValues === [] || count($cleanValues) > self::MAX_VALUES) {
                return $this->error("\"{$name}\" needs between 1 and ".self::MAX_VALUES.' choices', 400);
            }
            $clean[] = ['name' => $name, 'values' => $cleanValues];
        }
        $groups = $clean;

        $variants = $request->input('variants');
        if ($variants === null && $groups === []) {
            $variants = [['options' => [], 'stock_quantity' => $request->input('stock_quantity', 0)]];
        }
        if (! is_array($variants) || ! array_is_list($variants) || $variants === [] || count($variants) > self::MAX_VARIANTS) {
            return $this->error('Add at least one option combination to sell', 400);
        }

        $result = [];
        foreach ($variants as $variant) {
            $options = is_array($variant['options'] ?? null) ? $variant['options'] : [];
            $picked = [];
            foreach ($groups as $group) {
                $value = $options[$group['name']] ?? null;
                if (! in_array($value, $group['values'], true)) {
                    return $this->error("Every combination needs a \"{$group['name']}\" from its list", 400);
                }
                $picked[$group['name']] = $value;
            }
            if (count($options) !== count($picked)) {
                return $this->error("A combination uses an option that isn't listed", 400);
            }

            $key = self::optionsKey($picked);
            if (isset($result[$key])) {
                return $this->error('The same combination is listed twice', 400);
            }
            $stock = filter_var($variant['stock_quantity'] ?? 0, FILTER_VALIDATE_INT);
            $result[$key] = [
                'options' => $picked,
                'stock_quantity' => max(0, $stock === false ? 0 : $stock),
                'is_available' => ($variant['is_available'] ?? true) !== false,
            ];
        }

        return array_values($result);
    }

    /**
     * Makes the product's variants match the given list. Matching rows keep
     * their id, so past orders stay linked to them.
     */
    private function syncVariants(Product $product, array $variants): void
    {
        $existing = $product->variants()->get()->keyBy(fn ($v) => self::optionsKey($v->options));
        $keep = [];

        foreach ($variants as $i => $variant) {
            $attributes = [
                // An empty array would be stored as JSON [], not {}.
                'options' => (object) $variant['options'],
                'stock_quantity' => $variant['stock_quantity'],
                'is_available' => $variant['is_available'],
                'sort_order' => $i,
            ];
            $row = $existing->get(self::optionsKey($variant['options']));
            if ($row) {
                $row->update($attributes);
            } else {
                $row = $product->variants()->create($attributes);
            }
            $keep[] = $row->id;
        }

        $product->variants()->whereNotIn('id', $keep)->delete();
        $product->refreshStock();
    }

    private static function optionsKey(array $options): string
    {
        ksort($options);

        return json_encode($options);
    }

    // DELETE /api/products/{id}
    public function destroy(int $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return $this->error('Product not found', 404);
        }

        try {
            $product->delete();
        } catch (QueryException $e) {
            if ($this->isForeignKeyViolation($e)) {
                return $this->error("This product is part of past orders, so it can't be deleted. Hide it instead.", 409);
            }
            throw $e;
        }

        return ['message' => 'Product deleted', 'product' => $product];
    }
}
