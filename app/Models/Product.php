<?php

namespace App\Models;

use App\Casts\PgTextArray;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Product extends Model
{
    public const STATUSES = ['draft', 'published', 'sold_out', 'unavailable', 'discontinued'];

    public const FULFILLMENTS = ['ready', 'made_to_order'];

    protected $table = 'products';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    // Superseded by status and by option_groups/variants; kept in the table only.
    protected $hidden = ['is_visible', 'colors'];

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
            'option_groups' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order')->orderBy('id');
    }

    public function isMadeToOrder(): bool
    {
        return $this->fulfillment === 'made_to_order';
    }

    /** "Oat / Small": the variant's option values in the product's option order. */
    public function variantLabel(ProductVariant $variant): ?string
    {
        $values = array_map(fn ($group) => $variant->options[$group['name']] ?? null, $this->option_groups ?? []);
        $label = implode(' / ', array_filter($values, fn ($v) => $v !== null && $v !== ''));

        return $label === '' ? null : $label;
    }

    /** Keeps stock_quantity equal to the stock of the variants that can be ordered. */
    public function refreshStock(): void
    {
        DB::update(
            'UPDATE products SET stock_quantity = (
               SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants
               WHERE product_id = products.id AND is_available
             ) WHERE id = ?',
            [$this->id],
        );
    }
}
