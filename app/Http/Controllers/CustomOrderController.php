<?php

namespace App\Http\Controllers;

use App\Models\CustomOrderRequest;
use App\Support\AdminSession;
use App\Support\CommissionCapacity;
use App\Support\CustomerMail;
use App\Support\FileStore;
use Illuminate\Http\Request;

class CustomOrderController extends Controller
{
    // new -> quoted -> approved (by the customer) -> in_progress -> ready -> shipped -> completed.
    // quote_declined is the customer saying no; declined is the studio turning a request down.
    private const STATUSES = [
        'new', 'quoted', 'approved', 'in_progress', 'ready', 'shipped', 'completed', 'quote_declined', 'declined',
    ];

    // Status changes the customer hears about by email when the admin makes them.
    private const EMAILED = ['in_progress', 'ready', 'shipped', 'completed', 'declined'];

    // A quote can be (re)sent until the customer approves it.
    private const QUOTABLE = ['new', 'quoted', 'quote_declined'];

    // What the customer's status page shows; never the admin's notes or time estimate.
    private const PUBLIC_FIELDS = [
        'id', 'name', 'product_type', 'description', 'preferred_colors', 'preferred_size', 'yarn_type',
        'quantity', 'deadline', 'inspiration_image_url', 'additional_notes', 'status', 'quote_cents',
        'quote_ready_by', 'quote_message', 'quoted_at', 'responded_at', 'shipping_address', 'created_at',
    ];

    // POST /api/custom-orders - multipart form, optional inspiration_image
    public function store(Request $request)
    {
        if (! $request->filled('name') || ! $request->filled('email') || ! $request->filled('phone')
            || ! $request->filled('description')) {
            return $this->error('Name, email, phone, and a description of the idea are required', 400);
        }
        if ($invalid = $this->invalidInput($request, [
            'name' => 100, 'email' => 254, 'phone' => 40, 'product_type' => 100, 'description' => 5000,
            'preferred_colors' => 300, 'preferred_size' => 300, 'yarn_type' => 100, 'quantity' => 4,
            'deadline' => 10, 'budget_range' => 50, 'additional_notes' => 5000,
        ], ['email'])) {
            return $invalid;
        }
        if (! CommissionCapacity::current()['open']) {
            return $this->error("Our custom order book is full right now, so we can't take new requests. Please check back soon.", 409);
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
            'yarn_type' => $optional('yarn_type'),
            'quantity' => max(1, min(50, (int) $request->input('quantity') ?: 1)),
            'deadline' => self::date($request->input('deadline')),
            'budget_range' => $optional('budget_range'),
            'inspiration_image_url' => $image,
            'additional_notes' => $optional('additional_notes'),
            'access_token' => bin2hex(random_bytes(16)),
        ])->refresh();

        CustomerMail::customOrderUpdate($customOrder, 'received');

        return response()->json($customOrder->makeVisible('access_token'), 201);
    }

    // GET /api/custom-orders
    public function index()
    {
        return CustomOrderRequest::orderByDesc('created_at')->get()->each->makeVisible('access_token');
    }

    // GET /api/custom-orders/capacity - whether new requests are being taken.
    // The admin also gets the hours behind it.
    public function capacity(Request $request)
    {
        $capacity = CommissionCapacity::current();

        return AdminSession::check($request)
            ? $capacity
            : ['limited' => $capacity['limited'], 'open' => $capacity['open'], 'weeks_out' => $capacity['weeks_out']];
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

        $changed = $status !== null && $status !== $customOrder->status;
        $customOrder->update($this->provided($request, ['status', 'admin_notes']));

        return [
            ...$customOrder->makeVisible('access_token')->toArray(),
            'customer_notified' => $changed && in_array($status, self::EMAILED, true)
                ? CustomerMail::customOrderUpdate($customOrder, $status)
                : 'skipped',
        ];
    }

    // POST /api/custom-orders/{id}/quote - price, finish date, hours of work, message
    public function quote(Request $request, int $id)
    {
        $customOrder = CustomOrderRequest::find($id);
        if (! $customOrder) {
            return $this->error('Not found', 404);
        }
        if (! in_array($customOrder->status, self::QUOTABLE, true)) {
            return $this->error('This request has already been approved, so the quote can no longer change.', 409);
        }

        $cents = filter_var($request->input('quote_cents'), FILTER_VALIDATE_INT);
        $readyBy = self::date($request->input('quote_ready_by'));
        $hours = $request->input('quote_hours');
        if ($cents === false || $cents <= 0) {
            return $this->error('Enter the price for this piece', 400);
        }
        if ($readyBy === null || $readyBy < now()->toDateString()) {
            return $this->error('Enter the date the piece will be ready (today or later)', 400);
        }
        if ($hours !== null && $hours !== '' && (! is_numeric($hours) || $hours <= 0 || $hours > 1000)) {
            return $this->error('Hours of work must be a number between 0 and 1000', 400);
        }
        if ($invalid = $this->invalidInput($request, ['quote_message' => 2000])) {
            return $invalid;
        }

        $customOrder->update([
            'status' => 'quoted',
            'quote_cents' => $cents,
            'quote_ready_by' => $readyBy,
            'quote_hours' => $hours === null || $hours === '' ? null : round((float) $hours, 1),
            'quote_message' => trim((string) $request->input('quote_message')) ?: null,
            'quoted_at' => now(),
            'responded_at' => null,
            'decline_reason' => null,
        ]);

        return [
            ...$customOrder->makeVisible('access_token')->toArray(),
            'customer_notified' => CustomerMail::customOrderUpdate($customOrder, 'quoted'),
        ];
    }

    // GET /api/custom-orders/track/{token} - the customer's status page
    public function track(string $token)
    {
        $customOrder = CustomOrderRequest::where('access_token', $token)->first();

        return $customOrder
            ? $customOrder->only(self::PUBLIC_FIELDS)
            : $this->error('We couldn\'t find that request. Check the link in your email.', 404);
    }

    // POST /api/custom-orders/track/{token}/approve - the customer accepts the quote
    public function approve(Request $request, string $token)
    {
        $address = trim((string) $request->input('shipping_address'));
        if ($address === '') {
            return $this->error('Please enter the address we should deliver to', 400);
        }
        if ($invalid = $this->invalidInput($request, ['shipping_address' => 500])) {
            return $invalid;
        }

        $customOrder = CustomOrderRequest::where('access_token', $token)->first();
        if (! $customOrder) {
            return $this->error('Not found', 404);
        }
        if ($customOrder->status !== 'quoted') {
            return $this->error('This quote can\'t be approved any more. Reply to our email if something looks wrong.', 409);
        }

        $customOrder->update(['status' => 'approved', 'responded_at' => now(), 'shipping_address' => $address]);
        CustomerMail::customOrderUpdate($customOrder, 'approved');

        return $customOrder->only(self::PUBLIC_FIELDS);
    }

    // POST /api/custom-orders/track/{token}/decline - the customer turns the quote down
    public function decline(Request $request, string $token)
    {
        if ($invalid = $this->invalidInput($request, ['reason' => 1000])) {
            return $invalid;
        }

        $customOrder = CustomOrderRequest::where('access_token', $token)->first();
        if (! $customOrder) {
            return $this->error('Not found', 404);
        }
        if ($customOrder->status !== 'quoted') {
            return $this->error('This quote can\'t be declined any more.', 409);
        }

        $customOrder->update([
            'status' => 'quote_declined',
            'responded_at' => now(),
            'decline_reason' => trim((string) $request->input('reason')) ?: null,
        ]);

        return $customOrder->only(self::PUBLIC_FIELDS);
    }

    // DELETE /api/custom-orders/{id}
    public function destroy(int $id)
    {
        return CustomOrderRequest::whereKey($id)->delete()
            ? ['success' => true]
            : $this->error('Not found', 404);
    }

    /** Only a real YYYY-MM-DD date; anything else would fail the date column. */
    private static function date(mixed $value): ?string
    {
        return preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', (string) $value, $d)
            && checkdate((int) $d[2], (int) $d[3], (int) $d[1]) ? $d[0] : null;
    }
}
