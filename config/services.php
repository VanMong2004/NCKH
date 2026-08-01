<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
    ],

    'n8n' => [
        'webhook' => env('N8N_WEBHOOK_URL'),
        'secret' => env('N8N_WEBHOOK_SECRET'),

        'ai_sync_secret' => env('N8N_AI_SYNC_SECRET'),
        'ai_sync_limit' => (int) env('N8N_AI_SYNC_LIMIT', 20),

        'social_enabled' => filter_var(env('N8N_SOCIAL_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        'social_webhook_url' => env('N8N_SOCIAL_WEBHOOK_URL'),
        'social_webhook_secret' => env('N8N_SOCIAL_WEBHOOK_SECRET'),
        'social_callback_secret' => env('N8N_SOCIAL_CALLBACK_SECRET'),
        'social_public_url' => env('N8N_SOCIAL_PUBLIC_URL'),
    ],

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
        'vector_store_id' => env('OPENAI_VECTOR_STORE_ID'),
        'static_prompt_id' => env('OPENAI_STATIC_PROMPT_ID'),
        'static_prompt_version' => env('OPENAI_STATIC_PROMPT_VERSION'),
        'static_knowledge_max_results' => (int) env('OPENAI_STATIC_KNOWLEDGE_MAX_RESULTS', 5),
        'chat_max_history' => (int) env('OPENAI_CHAT_MAX_HISTORY', 12),
        'chat_summary_threshold' => (int) env('OPENAI_CHAT_SUMMARY_THRESHOLD', 30),
        'chat_session_expire_days' => (int) env('OPENAI_CHAT_SESSION_EXPIRE_DAYS', 7),
    ],

    'misa_invoice' => [
        'mode' => env('MISA_INVOICE_MODE', 'mock'),
    ],
];
