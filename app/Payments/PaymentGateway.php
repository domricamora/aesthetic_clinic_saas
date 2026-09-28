<?php

namespace App\Payments;

/**
 * A payment provider (plan.md §20). Manual cash, card and wallet payments taken
 * at the counter settle here today; a PayMongo, GCash or Maya gateway is added
 * by registering it in config/payments.php and pointing methods at it, with no
 * change to the register screen or the sale flow.
 */
interface PaymentGateway
{
    /** Method keys this gateway settles. @see \App\Models\Payment::METHODS */
    public function methods(): array;

    public function charge(Charge $charge): PaymentResult;

    public function refund(Charge $charge): PaymentResult;
}
