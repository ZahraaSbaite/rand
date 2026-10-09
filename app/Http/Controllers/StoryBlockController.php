<?php

namespace App\Http\Controllers;

use App\Models\StoryBlock;

class StoryBlockController extends ContentController
{
    protected string $model = StoryBlock::class;

    protected array $fields = ['heading', 'body', 'image_url', 'sort_order'];

    protected array $required = ['heading', 'body'];

    protected string $requiredMessage = 'heading and body are required';
}
