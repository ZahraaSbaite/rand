<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoryBlock extends Model
{
    protected $table = 'story_blocks';

    // Rows only have a created_at, which the database fills in.
    public $timestamps = false;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }
}
