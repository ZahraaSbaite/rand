<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'rating' => 'integer',
            'approved' => 'boolean',
            'created_at' => 'datetime',
        ];
    }
}
