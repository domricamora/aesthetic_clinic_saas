<?php

namespace App\Payments;

/** What a provider says happened. Nothing above this trusts the browser. */
final readonly class PaymentResult
{
    public function __construct(
        public bool $approved,
        public ?string $providerReference = null,
        public string $message = '',
    ) {}

    public static function approved(?string $reference = null, string $message = 'Approved.'): self
    {
        return new self(true, $reference, $message);
    }

    public static function rejected(string $message): self
    {
        return new self(false, null, $message);
    }
}
