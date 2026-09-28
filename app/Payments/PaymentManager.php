<?php

namespace App\Payments;

use InvalidArgumentException;

/** Routes a payment method to the gateway that settles it (plan.md §20). */
class PaymentManager
{
    /** @param  array<string, mixed>  $config  the payments config */
    public function __construct(private readonly array $config) {}

    public function charge(string $method, Charge $charge): PaymentResult
    {
        return $this->gatewayFor($method)->charge($this->withMethod($method, $charge));
    }

    public function refund(string $method, Charge $charge): PaymentResult
    {
        return $this->gatewayFor($method)->refund($this->withMethod($method, $charge));
    }

    /** Methods a gateway in the current configuration can actually settle. */
    public function availableMethods(): array
    {
        $methods = [];

        foreach (array_keys((array) $this->config['methods']) as $method) {
            if (in_array($method, $this->gatewayFor($method)->methods(), true)) {
                $methods[] = $method;
            }
        }

        return $methods;
    }

    private function gatewayFor(string $method): PaymentGateway
    {
        $key = $this->config['methods'][$method] ?? $this->config['default'] ?? null;
        $class = $key ? ($this->config['gateways'][$key] ?? null) : null;

        if (! is_string($class) || ! is_subclass_of($class, PaymentGateway::class)) {
            throw new InvalidArgumentException("No payment gateway is configured for [{$method}].");
        }

        return app($class);
    }

    private function withMethod(string $method, Charge $charge): Charge
    {
        return $charge->method === $method ? $charge : new Charge($charge->amountCentavos, $charge->reference, $method, $charge->note);
    }
}
