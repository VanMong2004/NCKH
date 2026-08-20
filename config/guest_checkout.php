<?php

return [
    'max_active_mock_bank' => 1,
    'max_active_offline_orders' => 2,
    'rate_limit_attempts' => 5,
    'rate_limit_minutes' => 10,
    'payment_rate_limit_attempts' => 12,
    'payment_rate_limit_minutes' => 10,
    'lock_seconds' => 10,
    'turnstile_enabled' => filter_var(env('GUEST_CHECKOUT_TURNSTILE_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
    'turnstile_payment_methods' => ['mock_bank'],
];
