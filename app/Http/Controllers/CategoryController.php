<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index()
    {
        return Category::orderBy('sort_order')->orderBy('name')->get();
    }

    // POST /api/categories
    public function store(Request $request)
    {
        if (! $request->filled('name')) {
            return $this->error('Category name is required', 400);
        }

        try {
            $category = Category::create([
                'name' => trim($request->input('name')),
                // New categories go to the end unless a position is given.
                'sort_order' => $request->input('sort_order') ?? (int) Category::max('sort_order') + 1,
                'description' => $request->input('description'),
            ]);
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return $this->error('That category already exists', 409);
            }
            throw $e;
        }

        return response()->json($category->refresh(), 201);
    }

    // PUT /api/categories/{id}
    public function update(Request $request, int $id)
    {
        if (! $request->filled('name')) {
            return $this->error('Category name is required', 400);
        }

        try {
            return DB::transaction(function () use ($request, $id) {
                $category = Category::find($id);
                if (! $category) {
                    return $this->error('Category not found', 404);
                }

                $oldName = $category->name;
                $newName = trim($request->input('name'));
                $category->update(['name' => $newName, ...$this->provided($request, ['sort_order', 'description'])]);

                // Keep existing products' category text in sync with the rename.
                Product::where('category', $oldName)->update(['category' => $newName]);

                return $category;
            });
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return $this->error('That category already exists', 409);
            }
            throw $e;
        }
    }

    // DELETE /api/categories/{id}
    public function destroy(int $id)
    {
        $category = Category::find($id);
        if (! $category) {
            return $this->error('Category not found', 404);
        }

        $category->delete();

        return ['message' => 'Category deleted', 'category' => $category];
    }
}
