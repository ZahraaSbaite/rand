<?php

namespace App\Support;

use App\Mail\CustomOrderUpdate;
use App\Mail\OrderUpdate;
use App\Models\CustomOrderRequest;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Emails a customer about their order or custom request. A failed email never fails the
 * checkout or the admin's update; it's logged and reported back instead.
 */
class CustomerMail
{
    /**
     * @param  'new'|'stage'|'paid'  $event  see OrderUpdate
     * @return 'sent'|'skipped'|'failed'
     */
    public static function orderUpdate(Order $order, string $event = 'stage'): string
    {
        $email = trim((string) $order->customer_email);
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'skipped';
        }

        try {
            Mail::to($email, $order->customer_name ?: null)->send(new OrderUpdate($order, $event));

            return 'sent';
        } catch (Throwable $e) {
            Log::error("Couldn't email order #{$order->id}", ['exception' => $e]);

            return 'failed';
        }
    }

    /**
     * @param  string  $event  a key of CustomOrderUpdate::EVENTS
     * @return 'sent'|'skipped'|'failed'
     */
    public static function customOrderUpdate(CustomOrderRequest $request, string $event): string
    {
        $email = trim((string) $request->email);
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'skipped';
        }

        try {
            Mail::to($email, $request->name ?: null)->send(new CustomOrderUpdate($request, $event));

            return 'sent';
        } catch (Throwable $e) {
            Log::error("Couldn't email custom request #{$request->id}", ['exception' => $e]);

            return 'failed';
        }
    }
}
