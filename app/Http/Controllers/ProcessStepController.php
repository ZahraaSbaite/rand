<?php

namespace App\Http\Controllers;

use App\Models\ProcessStep;

class ProcessStepController extends ContentController
{
    protected string $model = ProcessStep::class;

    protected array $fields = ['title', 'description', 'sort_order'];

    protected array $required = ['title', 'description'];

    protected string $requiredMessage = 'title and description are required';
}
