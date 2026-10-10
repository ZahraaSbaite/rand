<?php

namespace App\Http\Controllers;

use App\Models\CustomOrderRequest;
use App\Support\FileStore;
use Illuminate\Http\Request;

class CustomOrderController extends Controller
{
    private const STATUSES = ['new', 'quoted', 'in_progress', 'completed', 'declined'];

    // POST /api/custom-orders - multipart form, optional inspiration_image
    public function store(Request $request)
    {
        if (! $request->filled('name') || ! $request->filled('email') || ! $request->filled('phone')
            || ! $request->filled('description')) {
            return $this->error('Name, email, phone, and a description of the idea are required', 400);
        }

        // Like the old backend, a non-image attachment is ignored rather than rejected.
        $file = $request->file('inspiration_image');
        $image = $file && $file->isValid() && str_starts_with((string) $file->getMimeType(), 'image/')
            && $file->getSize() <= UploadController::MAX_BYTES
            ? FileStore::save($file)
            : null;

        $optional = fn (string $field) => $request->input($field) ?: null;

        $customOrder = CustomOrderRequest::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'product_type' => $optional('product_type'),
            'description' => $request->input('description'),
            'preferred_colors' => $optional('preferred_colors'),
            'preferred_size' => $optional('preferred_size'),
            'quantity' => (int) $request->input('quantity') ?: 1,
            'deadline' => $optional('deadline'),
            'budget_range' => $optional('budget_range'),
            'inspiration_image_url' => $image,
            'additional_notes' => $optional('additional_notes'),
        ]);

        return response()->json($customOrder->refresh(), 201);
    }

    // GET /api/custom-orders
    public function index()
    {
        return CustomOrderRequest::orderByDesc('created_at')->get();
    }

    // PATCH /api/custom-orders/{id} - status and private notes
    public function update(Request $request, int $id)
    {
        $status = $request->input('status');
        if ($status !== null && ! in_array($status, self::STATUSES, true)) {
            return $this->error('Invalid status', 400);
        }

        $customOrder = CustomOrderRequest::find($id);
        if (! $customOrder) {
            return $this->error('Not found', 404);
        }

        $customOrder->update($this->provided($request, ['status', 'admin_notes']));

        return $customOrder;
    }

    // DELETE /api/custom-orders/{id}
    public function destroy(int $id)
    {
        return CustomOrderRequest::whereKey($id)->delete()
            ? ['success' => true]
            : $this->error('Not found', 404);
    }
}
