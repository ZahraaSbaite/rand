<?php

namespace App\Http\Controllers;

use App\Models\JournalEntry;

class JournalController extends ContentController
{
    protected string $model = JournalEntry::class;

    protected array $fields = ['tag', 'entry_date', 'title', 'story', 'image_url', 'sort_order'];

    protected array $required = ['title', 'story'];

    protected string $requiredMessage = 'title and story are required';

    protected array $order = [['sort_order', 'asc'], ['entry_date', 'desc']];
}
