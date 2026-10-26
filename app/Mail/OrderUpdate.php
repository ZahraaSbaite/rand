<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\CheckoutOptions;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * "We've got your order" on checkout (event "new"), one email per fulfilment
 * stage ("stage"), and "we've received your payment" for bank transfers ("paid").
 */
class OrderUpdate extends Mailable
{
    public const STAGES = [
        'received' => [
            'label' => 'Received',
            'subject' => 'Your order #%d is in our queue',
            'heading' => 'Your order is in our queue',
            'body' => "Your order is waiting its turn. We'll email you again as soon as we start on it.",
        ],
        'preparing' => [
            'label' => 'Preparing',
            'subject' => 'We\'re preparing your order #%d',
            'heading' => 'We\'re getting your order ready',
            'body' => 'We\'re choosing the yarn and getting everything ready to start on your pieces.',
        ],
        'crocheting' => [
            'label' => 'Crocheting',
            'subject' => 'Your order #%d is on the hook',
            'heading' => 'Your pieces are being crocheted',
            'body' => 'Your order is being worked by hand right now, one stitch at a time.',
        ],
        'quality_check' => [
            'label' => 'Quality check',
            'subject' => 'Your order #%d is getting a final check',
            'heading' => 'Final checks',
            'body' => 'We\'re weaving in the ends and checking every piece before it leaves us.',
        ],
        'ready' => [
            'label' => 'Ready',
            'subject' => 'Your order #%d is ready',
            'heading' => 'Your order is ready',
            'body' => 'Everything is finished and packed. It will be on its way to you soon.',
        ],
        'shipped' => [
            'label' => 'Shipped',
            'subject' => 'Your order #%d is on its way',
            'heading' => 'Your order is on its way',
            'body' => 'Your order has been handed over for delivery.',
        ],
        'delivered' => [
            'label' => 'Delivered',
            'subject' => 'Your order #%d has been delivered',
            'heading' => 'Delivered. Enjoy!',
            'body' => 'Your order has been delivered. We hope you love it, and we\'d be glad to hear what you think in a review.',
        ],
    ];

    public function __construct(public Order $order, public string $event = 'stage')
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: match ($this->event) {
            'new' => "Thanks for your order #{$this->order->id}",
            'paid' => "We've received your payment for order #{$this->order->id}",
            default => sprintf($this->stage()['subject'], $this->order->id),
        });
    }

    public function content(): Content
    {
        $stage = $this->stage();
        $keys = array_keys(self::STAGES);
        $order = $this->order->loadMissing('items.product:id,name');

        return new Content(
            view: 'emails.order-update',
            text: 'emails.order-update-text',
            with: [
                'order' => $order,
                'heading' => match ($this->event) {
                    'new' => "We've got your order",
                    'paid' => 'Payment received. Your order is confirmed',
                    default => $stage['heading'],
                },
                'body' => trim(match ($this->event) {
                    'new' => "Thank you, {$order->customer_name}! Your order is in, and we'll email you as it moves along.",
                    'paid' => "Thank you, {$order->customer_name}! Your bank transfer has arrived, so your order is confirmed and in our queue.",
                    default => $stage['body'],
                }.' '.$this->paymentNote()),
                'stageLabel' => $stage['label'],
                'step' => array_search($order->tracking_stage, $keys, true) + 1,
                'steps' => count($keys),
                'items' => $order->items->map(fn ($item) => [
                    'name' => ($item->product?->name ?? 'Item').($item->variant_label ? " ({$item->variant_label})" : ''),
                    'quantity' => $item->quantity,
                    'total' => self::money($item->price_cents * $item->quantity),
                ]),
                'deliveryLabel' => $order->delivery_area ? "Delivery to {$order->delivery_area}" : 'Delivery',
                'deliveryFee' => self::money($order->delivery_fee_cents),
                'deliveryEta' => $order->delivery_eta,
                'totalLabel' => $order->payment_method === 'bank_transfer' ? 'Total (bank transfer)' : 'Total (cash on delivery)',
                'total' => self::money($order->total_cents),
                // Shown until the transfer arrives, so the customer knows where to send it.
                'bankDetails' => $order->payment_method === 'bank_transfer' && ! $order->paid_at
                    ? CheckoutOptions::bankTransferDetails()
                    : '',
                'trackUrl' => config('shop.site_url').'/order-tracking?'.http_build_query([
                    'order_id' => $order->id,
                    'email' => $order->customer_email,
                ]),
            ],
        );
    }

    /** What the customer still has to do about paying, if anything. */
    private function paymentNote(): string
    {
        $total = self::money($this->order->total_cents);

        if ($this->order->paid_at) {
            return '';
        }
        if ($this->order->payment_method === 'bank_transfer') {
            return "Please transfer {$total} to the account below, with your order number #{$this->order->id} as the reference. We'll start on your order once it arrives.";
        }

        // Cash on delivery only matters when ordering and when the courier is coming.
        return match (true) {
            $this->event === 'new' => "You'll pay {$total} in cash on delivery.",
            $this->order->tracking_stage === 'shipped' => "Please have {$total} ready in cash for the courier.",
            default => '',
        };
    }

    private function stage(): array
    {
        return self::STAGES[$this->order->tracking_stage] ?? self::STAGES['received'];
    }

    private static function money(int $cents): string
    {
        return '$'.number_format($cents / 100, 2);
    }
}
