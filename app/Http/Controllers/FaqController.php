<?php

namespace App\Http\Controllers;

use App\Models\Faq;

class FaqController extends ContentController
{
    protected string $model = Faq::class;

    protected array $fields = ['category', 'question', 'answer', 'sort_order'];

    protected array $required = ['category', 'question', 'answer'];

    protected string $requiredMessage = 'category, question and answer are required';

    protected array $order = [['category', 'asc'], ['sort_order', 'asc']];
}
