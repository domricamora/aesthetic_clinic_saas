<?php

namespace App\Payments;

use App\Models\Payment;
use Illuminate\Support\Str;

/**
 * Settles payments taken in person: cash, card, bank transfer, GCash, Maya and
 * anything else staff record. A provider gateway confirms online payments and
 * webhook instead; the caller cannot tell the difference.
 */
class ManualPaymentGateway implements PaymentGateway
{
    public function methods(): array
    {
        return array_keys(Payment::METHODS);
    }

    public function charge(Charge $charge): PaymentResult
    {
        return PaymentResult::approved(
            strtoupper(Str::random(8)),
            'Recorded at the counter.'
        );
    }

    public function refund(Charge $charge): PaymentResult
    {
        return PaymentResult::approved(
            strtoupper(Str::random(8)),
            'Refund released at the counter.'
        );
    }
}
