<?php

use App\Payments\ManualPaymentGateway;

/*
 * Payment providers (plan.md §20). Register a gateway class and point the
 * methods it settles at it; the register screen and sale flow do not change.
 * A provider gateway confirms online payments and webhook, so the browser is
 * never the source of truth for a payment status.
 */
return [

    'default' => env('PAYMENT_GATEWAY', 'manual'),

    'gateways' => [
        'manual' => ManualPaymentGateway::class,
    ],

    // Method key (App\Models\Payment::METHODS) => gateway key above.
    'methods' => [
        'cash' => 'manual',
        'card' => 'manual',
        'bank_transfer' => 'manual',
        'gcash' => 'manual',
        'maya' => 'manual',
        'other' => 'manual',
    ],

];
