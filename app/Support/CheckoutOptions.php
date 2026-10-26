<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Delivery areas and payment methods the shop offers, as set on the admin
 * Settings page. Checkout prices come from here, never from the browser.
 */
class CheckoutOptions
{
    /** Charged when the admin hasn't listed any delivery areas yet. */
    public const FLAT_DELIVERY_CENTS = 500;

    public const PAYMENT_METHODS = ['cash_on_delivery', 'bank_transfer'];

    /**
     * The delivery areas, each ['area' => name, 'fee_cents' => int, 'eta' => text].
     *
     * @return list<array{area: string, fee_cents: int, eta: string}>
     */
    public static function zones(): array
    {
        $zones = json_decode(self::setting('delivery_zones'), true);
        if (! is_array($zones)) {
            return [];
        }

        $valid = [];
        foreach ($zones as $zone) {
            $area = trim((string) ($zone['area'] ?? ''));
            $fee = filter_var($zone['fee_cents'] ?? null, FILTER_VALIDATE_INT);
            if ($area !== '' && $fee !== false && $fee >= 0) {
                $valid[] = ['area' => $area, 'fee_cents' => $fee, 'eta' => trim((string) ($zone['eta'] ?? ''))];
            }
        }

        return $valid;
    }

    /** Account details shown to customers who pay by bank transfer; empty turns the option off. */
    public static function bankTransferDetails(): string
    {
        return trim(self::setting('bank_transfer_details'));
    }

    /** @return list<string> */
    public static function paymentMethods(): array
    {
        return self::bankTransferDetails() === '' ? ['cash_on_delivery'] : self::PAYMENT_METHODS;
    }

    private static function setting(string $key): string
    {
        return (string) DB::table('site_settings')->where('key', $key)->value('value');
    }
}
