<?php

namespace App\Models;

use App\Casts\PgTextArray;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'stock_quantity' => 'integer',
            'review_count' => 'integer',
            'images' => PgTextArray::class,
            'colors' => PgTextArray::class,
            'featured' => 'boolean',
            'bestseller' => 'boolean',
            'is_visible' => 'boolean',
            'created_at' => 'datetime',
        ];
    }
}
