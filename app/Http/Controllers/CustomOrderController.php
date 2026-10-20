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
        if ($invalid = $this->invalidInput($request, [
            'name' => 100, 'email' => 254, 'phone' => 40, 'product_type' => 100, 'description' => 5000,
            'preferred_colors' => 300, 'preferred_size' => 300, 'quantity' => 4, 'deadline' => 10,
            'budget_range' => 50, 'additional_notes' => 5000,
        ], ['email'])) {
            return $invalid;
        }

        // Like the old backend, an unsupported attachment is ignored rather than rejected.
        $file = $request->file('inspiration_image');
        $image = null;
        if ($file && $file->isValid() && in_array($file->getMimeType(), UploadController::IMAGE_TYPES, true)
            && $file->getSize() <= UploadController::MAX_BYTES) {
            try {
                $image = FileStore::save($file);
            } catch (\RuntimeException $e) {
                // The request matters more than the photo; send it without.
                \Illuminate\Support\Facades\Log::warning('Custom order: inspiration image not saved', ['reason' => $e->getMessage()]);
            }
        }

        $optional = fn (string $field) => $request->input($field) ?: null;

        $customOrder = CustomOrderRequest::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'product_type' => $optional('product_type'),
            'description' => $request->input('description'),
            'preferred_colors' => $optional('preferred_colors'),
            'preferred_size' => $optional('preferred_size'),
            'quantity' => max(1, min(50, (int) $request->input('quantity') ?: 1)),
            // Only a real YYYY-MM-DD date; anything else would fail the date column.
            'deadline' => preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', (string) $request->input('deadline'), $d)
                && checkdate((int) $d[2], (int) $d[3], (int) $d[1]) ? $d[0] : null,
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
