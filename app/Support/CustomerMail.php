<?php

namespace App\Support;

use App\Mail\OrderUpdate;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Emails a customer about their order. A failed email never fails the
 * checkout or the admin's update; it's logged and reported back instead.
 */
class CustomerMail
{
    /** @return 'sent'|'skipped'|'failed' */
    public static function orderUpdate(Order $order, bool $isNew = false): string
    {
        $email = trim((string) $order->customer_email);
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return 'skipped';
        }

        try {
            Mail::to($email, $order->customer_name ?: null)->send(new OrderUpdate($order, $isNew));

            return 'sent';
        } catch (Throwable $e) {
            Log::error("Couldn't email order #{$order->id}", ['exception' => $e]);

            return 'failed';
        }
    }
}
