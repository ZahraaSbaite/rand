<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomOrderRequest extends Model
{
    protected $table = 'custom_order_requests';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'deadline' => 'date',
            'created_at' => 'datetime',
        ];
    }
}
