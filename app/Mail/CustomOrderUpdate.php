<?php

namespace App\Mail;

use App\Models\CustomOrderRequest;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** One email per step of a custom request: received, quoted, approved, then production. */
class CustomOrderUpdate extends Mailable
{
    public const EVENTS = [
        'received' => [
            'label' => 'Request received',
            'subject' => 'We\'ve got your custom request #%d',
            'heading' => 'Your request is in',
            'body' => 'Thank you for your idea! We\'ll look it over and send you a quote with a price and a finish date, usually within 2–3 business days. You can follow your request from the link below.',
        ],
        'quoted' => [
            'label' => 'Quote ready',
            'subject' => 'Your quote for custom request #%d',
            'heading' => 'Your quote is ready',
            'body' => 'Here\'s what your piece will cost and when it will be ready. Nothing is started until you approve, and you can approve or decline from the link below.',
        ],
        'approved' => [
            'label' => 'Approved',
            'subject' => 'Thanks for approving custom request #%d',
            'heading' => 'You\'re booked in',
            'body' => 'Thanks for approving the quote. Your piece has its place in our queue, and we\'ll email you when we start on it. You\'ll pay cash on delivery.',
        ],
        'in_progress' => [
            'label' => 'Crocheting',
            'subject' => 'Your custom piece #%d is on the hook',
            'heading' => 'We\'ve started on your piece',
            'body' => 'Your piece is being crocheted by hand right now, one stitch at a time.',
        ],
        'ready' => [
            'label' => 'Ready',
            'subject' => 'Your custom piece #%d is finished',
            'heading' => 'It\'s finished',
            'body' => 'Your piece is finished and packed. It will be on its way to you soon.',
        ],
        'shipped' => [
            'label' => 'Shipped',
            'subject' => 'Your custom piece #%d is on its way',
            'heading' => 'Your piece is on its way',
            'body' => 'Your piece has been handed over for delivery. Please have the payment ready, since it\'s cash on delivery.',
        ],
        'completed' => [
            'label' => 'Delivered',
            'subject' => 'Your custom piece #%d has been delivered',
            'heading' => 'Delivered. Enjoy!',
            'body' => 'Your piece has been delivered. We hope you love it, and thank you for trusting us with your idea.',
        ],
        'declined' => [
            'label' => 'Not taken on',
            'subject' => 'About your custom request #%d',
            'heading' => 'We can\'t make this one',
            'body' => 'Thank you for thinking of us. Unfortunately we can\'t take on this piece. Reply to this email if you\'d like to talk about something different.',
        ],
    ];

    public function __construct(public CustomOrderRequest $request, public string $event)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: sprintf($this->details()['subject'], $this->request->id));
    }

    public function content(): Content
    {
        $details = $this->details();
        $request = $this->request;
        // The quote is repeated on the steps where the customer is deciding or paying.
        $showQuote = $request->quote_cents !== null && in_array($this->event, ['quoted', 'approved', 'shipped'], true);

        return new Content(
            view: 'emails.custom-order-update',
            text: 'emails.custom-order-update-text',
            with: [
                'request' => $request,
                'label' => $details['label'],
                'heading' => $details['heading'],
                'body' => $details['body'],
                'piece' => $request->product_type ?: 'Custom piece',
                'quote' => $showQuote ? [
                    'price' => '$'.number_format($request->quote_cents / 100, 2),
                    'readyBy' => $request->quote_ready_by?->format('F j, Y'),
                    'message' => $request->quote_message,
                ] : null,
                'linkLabel' => $this->event === 'quoted' ? 'Review your quote' : 'See your request',
                'statusUrl' => config('shop.site_url').'/custom-order/'.$request->access_token,
            ],
        );
    }

    private function details(): array
    {
        return self::EVENTS[$this->event] ?? self::EVENTS['received'];
    }
}
