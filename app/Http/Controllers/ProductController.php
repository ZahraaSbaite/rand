<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\AdminSession;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    private const SORTS = [
        'newest' => 'created_at DESC',
        'price_asc' => 'price_cents ASC',
        'price_desc' => 'price_cents DESC',
        'featured' => 'featured DESC, rating DESC',
        'bestselling' => 'bestseller DESC, review_count DESC',
    ];

    private const FIELDS = [
        'name', 'description', 'price_cents', 'image_url', 'images', 'yarn_color', 'colors',
        'category', 'stock_quantity', 'materials', 'dimensions', 'care_instructions',
        'production_time', 'featured', 'bestseller', 'is_visible',
    ];

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
            $query->where('stock_quantity', '>', 0);
        }
        if ($request->query('featured') === 'true') {
            $query->where('featured', true);
        }
        if ($request->query('bestseller') === 'true') {
            $query->where('bestseller', true);
        }
        // Hidden products are only listed for a signed-in admin asking for them.
        if (! ($request->query('all') === 'true' && AdminSession::check($request))) {
            $query->where('is_visible', true);
        }

        $sort = self::SORTS[$request->query('sort')] ?? self::SORTS['newest'];

        return $query->orderByRaw($sort)->get();
    }

    // GET /api/products/{id}
    public function show(Request $request, int $id)
    {
        $product = Product::query()
            ->when(! AdminSession::check($request), fn ($q) => $q->where('is_visible', true))
            ->find($id);

        return $product ?? $this->error('Product not found', 404);
    }

    // POST /api/products
    public function store(Request $request)
    {
        if (! $request->filled('name') || $request->input('price_cents') === null) {
            return $this->error('name and price_cents are required', 400);
        }

        $product = new Product([
            'images' => [],
            'colors' => [],
            'stock_quantity' => 0,
            'featured' => false,
            'bestseller' => false,
            'is_visible' => true,
            ...$this->provided($request, self::FIELDS),
        ]);

        try {
            $product->save();
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return $this->error('A product with that name already exists', 409);
            }
            throw $e;
        }

        return response()->json($product->refresh(), 201);
    }

    // PUT /api/products/{id}
    public function update(Request $request, int $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return $this->error('Product not found', 404);
        }

        try {
            $product->update($this->provided($request, self::FIELDS));
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return $this->error('A product with that name already exists', 409);
            }
            throw $e;
        }

        return $product->refresh();
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
