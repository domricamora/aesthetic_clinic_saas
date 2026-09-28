<?php

namespace App\Payments;

/** An amount in centavos going to or coming from a provider. */
final readonly class Charge
{
    public function __construct(
        public int $amountCentavos,
        public string $reference,
        public string $method,
        public ?string $note = null,
    ) {}

    public static function pesos(float $amount, string $reference, string $method, ?string $note = null): self
    {
        return new self((int) round($amount * 100), $reference, $method, $note);
    }

    public function toPesos(): float
    {
        return $this->amountCentavos / 100;
    }
}
