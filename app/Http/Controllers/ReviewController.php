<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Support\AdminSession;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    // GET /api/reviews?product_id= - reviews for one product
    // (an admin without product_id gets every review)
    public function index(Request $request)
    {
        $productId = $request->query('product_id');

        if (! $productId && AdminSession::check($request)) {
            return Review::orderByDesc('created_at')->get();
        }
        if (! $productId) {
            return $this->error('product_id is required', 400);
        }

        return Review::where('product_id', (int) $productId)
            ->orderByDesc('created_at')
            ->get(['id', 'product_id', 'customer_name', 'rating', 'comment', 'created_at']);
    }

    // GET /api/reviews/public - every review with its product name
    public function publicIndex()
    {
        return Review::join('products as p', 'p.id', '=', 'reviews.product_id')
            ->orderByDesc('reviews.created_at')
            ->get([
                'reviews.id', 'reviews.product_id', 'reviews.customer_name', 'reviews.rating',
                'reviews.comment', 'reviews.created_at', 'p.name as product_name',
            ]);
    }

    // GET /api/reviews/admin - all reviews, with the reviewer's email
    public function adminIndex()
    {
        return Review::join('products as p', 'p.id', '=', 'reviews.product_id')
            ->orderByDesc('reviews.created_at')
            ->get(['reviews.*', 'p.name as product_name']);
    }

    // POST /api/reviews - published straight away; the admin can delete it
    public function store(Request $request)
    {
        $fields = ['product_id', 'customer_name', 'customer_email', 'rating', 'comment'];
        foreach ($fields as $field) {
            if (! $request->input($field)) {
                return $this->error('Missing required fields', 400);
            }
        }

        $rating = filter_var($request->input('rating'), FILTER_VALIDATE_INT);
        if ($rating === false || $rating < 1 || $rating > 5) {
            return $this->error('Rating must be between 1 and 5', 400);
        }
        if ($invalid = $this->invalidInput($request, [
            'customer_name' => 80, 'customer_email' => 254, 'comment' => 2000, 'product_id' => 12,
        ], ['customer_email'])) {
            return $invalid;
        }

        try {
            $review = Review::create([...$request->only($fields), 'approved' => true]);
        } catch (QueryException $e) {
            if ($this->isForeignKeyViolation($e)) {
                return $this->error('Invalid product_id', 400);
            }
            throw $e;
        }

        $review->refresh();
        $this->recomputeProductRating($review->product_id);

        return response()->json(
            $review->only(['id', 'product_id', 'customer_name', 'rating', 'comment', 'approved', 'created_at']),
            201,
        );
    }

    // DELETE /api/reviews/{id}
    public function destroy(int $id)
    {
        $review = Review::find($id);
        if (! $review) {
            return $this->error('Review not found', 404);
        }

        $review->delete();
        $this->recomputeProductRating($review->product_id);

        return ['success' => true];
    }

    /** Products store their review average and count for listing pages. */
    private function recomputeProductRating(int $productId): void
    {
        DB::update(
            'UPDATE products SET
               review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = :id),
               rating = COALESCE(
                 (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = :id2),
                 0
               )
             WHERE id = :id3',
            ['id' => $productId, 'id2' => $productId, 'id3' => $productId],
        );
    }
}
