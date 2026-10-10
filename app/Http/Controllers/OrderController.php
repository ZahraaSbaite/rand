<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Support\CustomerMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const STATUSES = ['not_started', 'in_progress', 'done'];

    private const TRACKING_STAGES = [
        'received', 'preparing', 'crocheting', 'quality_check', 'ready', 'shipped', 'delivered',
    ];

    // GET /api/orders - every order with its line items
    public function index()
    {
        return Order::with('items.product:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->withItems($order));
    }

    // GET /api/orders/track?order_id=&email=
    // Needs the order id and matching email so customers can't browse others' orders.
    public function track(Request $request)
    {
        $orderId = filter_var($request->query('order_id'), FILTER_VALIDATE_INT);
        $email = trim((string) $request->query('email'));

        if ($orderId === false || $email === '') {
            return $this->error('order_id and email are required', 400);
        }

        $order = Order::with('items.product:id,name')
            ->whereKey($orderId)
            ->whereRaw('lower(customer_email) = lower(?)', [$email])
            ->first(['id', 'customer_name', 'status', 'tracking_stage', 'total_cents', 'created_at']);

        if (! $order) {
            return $this->error('No order found with that ID and email', 404);
        }

        return $this->withItems($order);
    }

    // PATCH /api/orders/{id}/status - admin kanban column
    public function updateStatus(Request $request, int $id)
    {
        $status = $request->input('status');
        if (! in_array($status, self::STATUSES, true)) {
            return $this->error('Invalid status', 400);
        }

        return $this->updateField($id, 'status', $status);
    }

    // PATCH /api/orders/{id}/tracking - customer-facing fulfillment stage
    public function updateTracking(Request $request, int $id)
    {
        $stage = $request->input('tracking_stage');
        if (! in_array($stage, self::TRACKING_STAGES, true)) {
            return $this->error('Invalid tracking_stage', 400);
        }

        $order = Order::find($id);
        if (! $order) {
            return $this->error('Order not found', 404);
        }

        // Email the customer only when the stage actually moves.
        $changed = $order->tracking_stage !== $stage;
        $order->update(['tracking_stage' => $stage]);

        return [
            ...$order->toArray(),
            'customer_notified' => $changed ? CustomerMail::orderUpdate($order) : 'skipped',
        ];
    }

    // DELETE /api/orders/{id}
    public function destroy(int $id)
    {
        $deleted = DB::transaction(function () use ($id) {
            $order = Order::find($id);
            if (! $order) {
                return false;
            }
            // order_items has no ON DELETE CASCADE, so remove the lines first.
            $order->items()->delete();
            $order->delete();

            return true;
        });

        return $deleted ? ['success' => true] : $this->error('Order not found', 404);
    }

    // POST /api/orders - cash-on-delivery checkout
    public function store(Request $request)
    {
        foreach (['customer_name', 'customer_email', 'customer_phone', 'customer_address'] as $field) {
            if (! is_string($request->input($field)) || trim($request->input($field)) === '') {
                return $this->error('Name, email, phone, and address are required', 400);
            }
        }

        $items = $request->input('items');
        if (! is_array($items) || $items === [] || ! array_is_list($items)) {
            return $this->error('Cart is empty', 400);
        }

        foreach ($items as $i => $item) {
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
            if (! is_int($item['product_id'] ?? null) || $quantity === false || $quantity <= 0) {
                return $this->error('Each item needs a valid product_id and a positive integer quantity', 400);
            }
            $items[$i] = ['product_id' => $item['product_id'], 'quantity' => $quantity];
        }

        $result = DB::transaction(function () use ($request, $items) {
            // Lock the rows so two checkouts can't oversell the same stock.
            $products = Product::whereIn('id', array_column($items, 'product_id'))
                ->lockForUpdate()
                ->get(['id', 'price_cents', 'stock_quantity', 'name'])
                ->keyBy('id');

            foreach ($items as $item) {
                $product = $products->get($item['product_id']);

                if (! $product) {
                    return $this->error("Product {$item['product_id']} does not exist", 400);
                }
                if ($product->stock_quantity < $item['quantity']) {
                    return $this->error(
                        "Not enough stock for \"{$product->name}\" — only {$product->stock_quantity} left",
                        409,
                    );
                }
            }

            $order = Order::create([
                ...$request->only(['customer_name', 'customer_email', 'customer_phone', 'customer_address']),
                'status' => 'not_started',
                'tracking_stage' => 'received',
                'total_cents' => array_sum(array_map(
                    fn ($item) => $products[$item['product_id']]->price_cents * $item['quantity'],
                    $items,
                )),
            ]);

            foreach ($items as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price_cents' => $products[$item['product_id']]->price_cents,
                ]);
                Product::whereKey($item['product_id'])->decrement('stock_quantity', $item['quantity']);
            }

            return $order->refresh();
        });

        if (! $result instanceof Order) {
            return $result; // an error response; nothing was saved
        }

        // Sent after the order is committed, so a mail problem can't undo a sale.
        CustomerMail::orderUpdate($result, isNew: true);

        return response()->json($result->withoutRelations(), 201);
    }

    private function updateField(int $id, string $field, string $value)
    {
        $order = Order::find($id);
        if (! $order) {
            return $this->error('Order not found', 404);
        }

        $order->update([$field => $value]);

        return $order;
    }

    /** The order as JSON with its line items flattened the way the frontend expects. */
    private function withItems(Order $order): array
    {
        $items = $order->items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'product_name' => $item->product?->name,
            'quantity' => $item->quantity,
            'price_cents' => $item->price_cents,
        ]);

        return [...$order->withoutRelations()->toArray(), 'items' => $items];
    }
}
