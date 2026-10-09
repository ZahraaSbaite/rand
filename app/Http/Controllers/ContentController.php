<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * List / create / patch / delete for the editable page content (collections,
 * FAQs, journal entries, process steps, story blocks).
 */
abstract class ContentController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** Columns the admin can set. */
    protected array $fields;

    /** Fields that must be present when creating, and the error when one isn't. */
    protected array $required;

    protected string $requiredMessage;

    /** [column, direction] pairs for the list. */
    protected array $order = [['sort_order', 'asc']];

    public function index()
    {
        $query = $this->model::query();
        foreach ($this->order as [$column, $direction]) {
            $query->orderBy($column, $direction);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        foreach ($this->required as $field) {
            if (! $request->input($field)) {
                return $this->error($this->requiredMessage, 400);
            }
        }

        // Missing fields fall back to the column defaults (sort_order 0, etc.).
        $row = $this->model::create($this->provided($request, $this->fields));

        return response()->json($row->refresh(), 201);
    }

    public function update(Request $request, int $id)
    {
        $row = $this->model::find($id);
        if (! $row) {
            return $this->error('Not found', 404);
        }

        $row->update($this->provided($request, $this->fields));

        return $row;
    }

    public function destroy(int $id)
    {
        return $this->model::whereKey($id)->delete()
            ? ['success' => true]
            : $this->error('Not found', 404);
    }
}
