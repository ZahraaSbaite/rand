<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomOrderRequest extends Model
{
    protected $table = 'custom_order_requests';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    // The token is the customer's key to their status page; only they and the admin see it.
    protected $hidden = ['access_token'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'deadline' => 'date',
            'quote_cents' => 'integer',
            'quote_ready_by' => 'date',
            'quote_hours' => 'float',
            'quoted_at' => 'datetime',
            'responded_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
