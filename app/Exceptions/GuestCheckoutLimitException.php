<?php

namespace App\Exceptions;

use RuntimeException;

class GuestCheckoutLimitException extends RuntimeException
{
    public function __construct(
        string $message,
        protected string $apiCode,
        protected array $payload = [],
        int $status = 409
    ) {
        parent::__construct($message, $status);
    }

    public function getApiCode(): string
    {
        return $this->apiCode;
    }

    public function getPayload(): array
    {
        return $this->payload;
    }
}
