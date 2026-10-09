<?php

namespace App\Http\Controllers;

use App\Models\Collection;

class CollectionController extends ContentController
{
    protected string $model = Collection::class;

    protected array $fields = ['name', 'slug', 'tagline', 'image_url', 'sort_order'];

    protected array $required = ['name', 'slug'];

    protected string $requiredMessage = 'name and slug are required';
}
