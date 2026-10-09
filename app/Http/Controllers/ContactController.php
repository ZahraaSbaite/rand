<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    // POST /api/contact
    public function store(Request $request)
    {
        if (! $request->filled('name') || ! $request->filled('email') || ! $request->filled('message')) {
            return $this->error('Name, email, and message are required', 400);
        }

        $message = ContactMessage::create([
            ...$request->only(['name', 'email', 'message']),
            'subject' => $request->input('subject') ?: null,
        ]);

        return response()->json($message->refresh(), 201);
    }

    // GET /api/contact
    public function index()
    {
        return ContactMessage::orderByDesc('created_at')->get();
    }

    // PATCH /api/contact/{id} - mark read / unread
    public function update(Request $request, int $id)
    {
        $isRead = $request->input('is_read');
        if (! is_bool($isRead)) {
            return $this->error('is_read must be true or false', 400);
        }

        $message = ContactMessage::find($id);
        if (! $message) {
            return $this->error('Not found', 404);
        }

        $message->update(['is_read' => $isRead]);

        return $message;
    }

    // DELETE /api/contact/{id}
    public function destroy(int $id)
    {
        return ContactMessage::whereKey($id)->delete()
            ? ['success' => true]
            : $this->error('Not found', 404);
    }
}
