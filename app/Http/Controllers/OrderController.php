<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\CheckoutOptions;
use App\Support\CustomerMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const STATUSES = ['not_started', 'in_progress', 'done'];

    private const MAX_NOTE = 500;

    private const TRACKING_STAGES = [
        'received', 'preparing', 'crocheting', 'quality_check', 'ready', 'shipped', 'delivered',
    ];

    // GET /api/orders - every order with its line items
    public function index()
    {
        return Order::with('items.product:id,name,fulfillment')
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

        $order = Order::with('items.product:id,name,fulfillment')
            ->whereKey($orderId)
            ->whereRaw('lower(customer_email) = lower(?)', [$email])
            ->first([
                'id', 'customer_name', 'status', 'tracking_stage', 'total_cents', 'created_at',
                'delivery_area', 'delivery_fee_cents', 'delivery_eta', 'payment_method', 'paid_at',
            ]);

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

        // Email the customer only when the status actually changes.
        $changed = $order->tracking_stage !== $stage;
        $order->update(['tracking_stage' => $stage, 'status' => self::boardColumn($stage)]);

        return [
            ...$order->toArray(),
            'customer_notified' => $changed ? CustomerMail::orderUpdate($order) : 'skipped',
        ];
    }

    // PATCH /api/orders/{id}/payment - admin marks the money as received (or not)
    public function updatePayment(Request $request, int $id)
    {
        $paid = $request->input('paid');
        if (! is_bool($paid)) {
            return $this->error('paid must be true or false', 400);
        }

        $order = Order::find($id);
        if (! $order) {
            return $this->error('Order not found', 404);
        }

        // Email the customer only when a bank transfer first arrives; cash is
        // paid to the courier, so there's nothing to tell them.
        $notify = $paid && $order->paid_at === null && $order->payment_method === 'bank_transfer';
        $order->update(['paid_at' => $paid ? ($order->paid_at ?? now()) : null]);

        return [
            ...$order->toArray(),
            'customer_notified' => $notify ? CustomerMail::orderUpdate($order, 'paid') : 'skipped',
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

    // POST /api/orders - checkout, paid by cash on delivery or bank transfer
    public function store(Request $request)
    {
        foreach (['customer_name', 'customer_email', 'customer_phone', 'customer_address'] as $field) {
            if (! is_string($request->input($field)) || trim($request->input($field)) === '') {
                return $this->error('Name, email, phone, and address are required', 400);
            }
        }
        if ($invalid = $this->invalidInput($request, [
            'customer_name' => 100, 'customer_email' => 254, 'customer_phone' => 40, 'customer_address' => 500,
        ], ['customer_email'])) {
            return $invalid;
        }

        $paymentMethod = $request->input('payment_method', 'cash_on_delivery');
        if (! in_array($paymentMethod, CheckoutOptions::paymentMethods(), true)) {
            return $this->error('Please choose one of the payment methods offered.', 400);
        }

        // With no areas set up, every order pays the flat fee.
        $zones = CheckoutOptions::zones();
        $zone = ['area' => null, 'fee_cents' => CheckoutOptions::FLAT_DELIVERY_CENTS, 'eta' => null];
        if ($zones !== []) {
            $area = $request->input('delivery_area');
            $matches = array_filter($zones, fn ($z) => $z['area'] === $area);
            if ($matches === []) {
                return $this->error('Please choose a delivery area.', 400);
            }
            $zone = array_values($matches)[0];
        }

        $items = $request->input('items');
        if (! is_array($items) || $items === [] || ! array_is_list($items)) {
            return $this->error('Cart is empty', 400);
        }
        if (count($items) > 50) {
            return $this->error('That cart has too many lines.', 400);
        }

        foreach ($items as $i => $item) {
            $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
            if (! is_int($item['product_id'] ?? null) || $quantity === false || $quantity <= 0) {
                return $this->error('Each item needs a valid product_id and a positive integer quantity', 400);
            }
            $variantId = $item['variant_id'] ?? null;
            if ($variantId !== null && ! is_int($variantId)) {
                return $this->error('Each item variant_id must be a number', 400);
            }
            // Carts saved before options existed send the color they picked instead.
            $color = is_string($item['color'] ?? null) ? $item['color'] : null;
            // Colors the customer picked for a piece made in any color.
            $colors = $item['colors'] ?? [];
            if (! is_array($colors) || ! array_is_list($colors) || count($colors) > Product::MAX_CUSTOM_COLORS) {
                return $this->error('Each item can have at most '.Product::MAX_CUSTOM_COLORS.' colors', 400);
            }
            foreach ($colors as $c => $name) {
                $name = is_string($name) ? trim($name) : '';
                if ($name === '' || mb_strlen($name) > 40) {
                    return $this->error('Each color name must be 1 to 40 characters', 400);
                }
                $colors[$c] = $name;
            }
            // The customer's message about this piece.
            $note = $item['note'] ?? null;
            if ($note !== null && (! is_string($note) || mb_strlen($note) > self::MAX_NOTE)) {
                return $this->error('A message about an item can be at most '.self::MAX_NOTE.' characters', 400);
            }
            $items[$i] = [
                'product_id' => $item['product_id'], 'variant_id' => $variantId, 'color' => $color,
                'colors' => array_values(array_unique($colors)), 'note' => trim((string) $note) ?: null,
                'quantity' => $quantity,
            ];
        }

        $result = DB::transaction(function () use ($request, $items, $paymentMethod, $zone) {
            $products = Product::whereIn('id', array_column($items, 'product_id'))
                ->get(['id', 'name', 'price_cents', 'status', 'fulfillment', 'option_groups', 'custom_colors', 'available_colors', 'allow_other_colors'])
                ->keyBy('id');
            // Lock the variant rows so two checkouts can't oversell the same stock.
            $variants = ProductVariant::whereIn('product_id', $products->keys())
                ->orderBy('sort_order')
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->groupBy('product_id');

            // The same option can't be on two lines, but count it as if it could.
            $wanted = [];
            foreach ($items as $i => $item) {
                $product = $products->get($item['product_id']);

                if (! $product) {
                    return $this->error("Product {$item['product_id']} does not exist", 400);
                }
                if ($product->status !== 'published') {
                    return $this->error("\"{$product->name}\" can't be ordered right now. Please remove it from your cart.", 409);
                }

                $variant = self::pickVariant($variants->get($product->id, collect()), $item);
                if (! $variant) {
                    return $this->error("Please choose the options for \"{$product->name}\" again.", 400);
                }
                $label = $product->variantLabel($variant);
                if (! $variant->is_available) {
                    return $this->error("\"{$product->name}\"".($label ? " in {$label}" : '').' is sold out.', 409);
                }

                if ($product->custom_colors > 0) {
                    if ($item['colors'] === []) {
                        return $this->error("Please choose the colors for \"{$product->name}\".", 400);
                    }
                    if (count($item['colors']) > $product->custom_colors) {
                        return $this->error("\"{$product->name}\" can be made in up to {$product->custom_colors} colors.", 400);
                    }
                    // Only the listed colors, unless the studio takes requests for others too.
                    $listed = array_map('mb_strtolower', $product->available_colors ?? []);
                    if ($listed !== [] && ! $product->allow_other_colors) {
                        foreach ($item['colors'] as $name) {
                            if (! in_array(mb_strtolower($name), $listed, true)) {
                                return $this->error("\"{$product->name}\" isn't made in {$name}. Please pick one of its colors.", 400);
                            }
                        }
                    }
                } else {
                    $items[$i]['colors'] = [];
                }

                $items[$i]['variant'] = $variant;
                // The picked colors go in the label too, so every view of the order shows them.
                $items[$i]['variant_label'] = implode(' · ', array_filter([$label, implode(', ', $items[$i]['colors'])])) ?: null;
                $wanted[$variant->id] = ($wanted[$variant->id] ?? 0) + $item['quantity'];

                // Made-to-order pieces are crocheted after ordering, so there's no stock to run out of.
                if (! $product->isMadeToOrder() && $variant->stock_quantity < $wanted[$variant->id]) {
                    return $this->error(
                        "Not enough stock for \"{$product->name}\"".($label ? " ({$label})" : '')
                            ." — only {$variant->stock_quantity} left",
                        409,
                    );
                }
            }

            $order = Order::create([
                ...$request->only(['customer_name', 'customer_email', 'customer_phone', 'customer_address']),
                'status' => 'not_started',
                'tracking_stage' => 'received',
                'payment_method' => $paymentMethod,
                'delivery_area' => $zone['area'],
                'delivery_fee_cents' => $zone['fee_cents'],
                'delivery_eta' => $zone['eta'] ?: null,
                'total_cents' => $zone['fee_cents'] + array_sum(array_map(
                    fn ($item) => $products[$item['product_id']]->price_cents * $item['quantity'],
                    $items,
                )),
            ]);

            foreach ($items as $item) {
                $product = $products[$item['product_id']];
                $order->items()->create([
                    'product_id' => $product->id,
                    'variant_id' => $item['variant']->id,
                    'variant_label' => $item['variant_label'],
                    'colors' => $item['colors'] === [] ? null : implode(', ', $item['colors']),
                    'note' => $item['note'],
                    'quantity' => $item['quantity'],
                    'price_cents' => $product->price_cents,
                ]);
                if (! $product->isMadeToOrder()) {
                    $item['variant']->decrement('stock_quantity', $item['quantity']);
                }
            }
            $products->each->refreshStock();

            return $order->refresh();
        });

        if (! $result instanceof Order) {
            return $result; // an error response; nothing was saved
        }

        // Sent after the order is committed, so a mail problem can't undo a sale.
        CustomerMail::orderUpdate($result, 'new');

        return response()->json($result->withoutRelations(), 201);
    }

    /**
     * The variant a cart line asks for: by id, else by the color an older cart
     * saved, else the only variant of a product without options.
     */
    private static function pickVariant($variants, array $item): ?ProductVariant
    {
        if ($item['variant_id'] !== null) {
            return $variants->firstWhere('id', $item['variant_id']);
        }
        if ($item['color'] !== null) {
            $match = $variants->first(fn ($v) => in_array($item['color'], $v->options, true));
            if ($match) {
                return $match;
            }
        }

        return $variants->count() === 1 ? $variants->first() : null;
    }

    /** The admin board column an order's status belongs in. */
    private static function boardColumn(string $stage): string
    {
        return match ($stage) {
            'received' => 'not_started',
            'shipped', 'delivered' => 'done',
            default => 'in_progress',
        };
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
            'variant_id' => $item->variant_id,
            'variant_label' => $item->variant_label,
            'note' => $item->note,
            'made_to_order' => $item->product?->fulfillment === 'made_to_order',
            'quantity' => $item->quantity,
            'price_cents' => $item->price_cents,
        ]);

        return [...$order->withoutRelations()->toArray(), 'items' => $items];
    }
}
