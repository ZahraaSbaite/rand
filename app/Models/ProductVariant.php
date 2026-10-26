<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One orderable combination of a product's options, with its own stock. */
class ProductVariant extends Model
{
    protected $table = 'product_variants';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $hidden = ['product_id', 'sort_order'];

    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'options' => 'array',
            'stock_quantity' => 'integer',
            'is_available' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
